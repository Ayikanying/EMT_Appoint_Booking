import json
import uuid
from datetime import datetime, date
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required, user_passes_test

from .models import Appointment, Profile

# Helpers
def is_admin(user):
    return user.is_staff


# User Registration / Login / Logout
@csrf_exempt
@require_POST
def register_user(request):
    try:
        data = json.loads(request.body)
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'patient')
        phone_number = data.get('phone_number', '')
        hospital_id = data.get('hospital_id', '')
        speciality = data.get('speciality', '')

        if not full_name or not email or not password:
            return JsonResponse({'error': 'All fields are required'}, status=400)

        if role == 'doctor' and (not speciality or not hospital_id):
            return JsonResponse({'error': 'Speciality and Hospital ID required for doctors'}, status=400)

        if User.objects.filter(username=email).exists():
            return JsonResponse({'error': 'User already exists'}, status=400)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=full_name)
        if role == 'doctor':
            user.is_staff = True
            user.save()

        Profile.objects.create(
            user=user,
            role=role,
            phone_number=phone_number,
            speciality=speciality if role == 'doctor' else '',
            hospital_id=hospital_id if role == 'doctor' else ''
        )

        return JsonResponse({'message': 'User registered successfully'}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def login_user(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'is_admin': user.is_staff
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_POST
def logout_user(request):
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


def login_page(request):
    return render(request, 'core/login.html')

def register_page(request):
    return render(request, 'core/register.html')

def profile_page(request):
    profile = request.user.profile
    return render(request, 'core/profile.html', {'profile': profile})

# Appointments Page
@login_required
def appointments_page(request):
    user = request.user
    if user.is_staff:
        total_appointments = Appointment.objects.count()
        pending_appointments = Appointment.objects.filter(status='PENDING').count()
        completed_appointments = Appointment.objects.filter(status='COMPLETED').count()
        cancelled_appointments = Appointment.objects.filter(status='REJECTED').count()
    else:
        total_appointments = Appointment.objects.filter(user=user).count()
        pending_appointments = Appointment.objects.filter(user=user, status='PENDING').count()
        completed_appointments = Appointment.objects.filter(user=user, status='COMPLETED').count()
        cancelled_appointments = Appointment.objects.filter(user=user, status='REJECTED').count()

    context = {
        'total_appointments': total_appointments,
        'pending_appointments': pending_appointments,
        'completed_appointments': completed_appointments,
        'cancelled_appointments': cancelled_appointments,
    }
    return render(request, 'core/appointments.html', context)


# Appointment APIs
@login_required
@require_POST
def create_appointment(request):
    try:
        data = json.loads(request.body)
        service_type = data.get('service_type')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        notes = data.get('notes', '')

        if not service_type or not appointment_date or not appointment_time:
            return JsonResponse({'error': 'Service, date, and time are required'}, status=400)

        date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(appointment_time, '%H:%M').time()

        if date_obj < date.today():
            return JsonResponse({'error': 'Appointment cannot be in the past'}, status=400)

        appointment = Appointment.objects.create(
            user=request.user,
            service_type=service_type,
            appointment_date=date_obj,
            appointment_time=time_obj,
            notes=notes
        )

        return JsonResponse({'message': 'Appointment created successfully', 'appointment_id': appointment.id}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def list_appointments(request):
    try:
        appointments = Appointment.objects.all() if request.user.is_staff else Appointment.objects.filter(user=request.user)
        appointments_list = [
            {
                'id': appt.id,
                'service_type': appt.service_type,
                'appointment_date': appt.appointment_date.strftime('%Y-%m-%d'),
                'appointment_time': appt.appointment_time.strftime('%H:%M'),
                'status': appt.status,
                'notes': appt.notes or '',
                'is_paid': appt.is_paid,
                'payment_method': appt.payment_method or '',
            }
            for appt in appointments
        ]
        return JsonResponse({'appointments': appointments_list}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_POST
def delete_appointment(request, appointment_id):
    try:
        appointment = Appointment.objects.get(id=appointment_id, user=request.user)
        appointment.delete()
        return JsonResponse({'message': 'Appointment deleted successfully'})
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)


@login_required
@require_POST
def pay_for_appointment(request, appointment_id):
    try:
        data = json.loads(request.body)
        method = data.get('payment_method')
        if method not in ['MTN', 'AIRTEL']:
            return JsonResponse({'error': 'Invalid payment method'}, status=400)

        appointment = Appointment.objects.get(id=appointment_id, user=request.user)
        if appointment.is_paid:
            return JsonResponse({'error': 'Already paid'}, status=400)
        if appointment.status != 'PENDING':
            return JsonResponse({'error': 'Only pending appointments can be paid'}, status=400)

        appointment.is_paid = True
        appointment.payment_method = method
        appointment.transaction_id = str(uuid.uuid4())
        appointment.save()

        return JsonResponse({'message': 'Payment successful', 'transaction_id': appointment.transaction_id})

    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Admin Only: Update Appointment
@csrf_exempt
@login_required
@user_passes_test(is_admin)
@require_POST
def update_appointment(request, appointment_id):
    try:
        data = json.loads(request.body)
        status = data.get('status')
        notes = data.get('notes', '')

        if status not in ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']:
            return JsonResponse({'error': 'Invalid status'}, status=400)

        appointment = Appointment.objects.get(id=appointment_id)
        appointment.status = status
        appointment.notes = notes
        appointment.save()

        return JsonResponse({'message': 'Appointment updated successfully'}, status=200)

    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
