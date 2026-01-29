import json
from datetime import datetime
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from .models import Appointment, Profile, Payment

# Registration
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

        if not full_name or not email or not password:
            return JsonResponse({'error': 'All fields are required'}, status=400)

        if User.objects.filter(username=email).exists():
            return JsonResponse({'error': 'User already exists'}, status=400)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=full_name)
        if role == 'doctor':
            user.is_staff = True
            user.save()

        Profile.objects.create(user=user, role=role.upper(), phone_number=phone_number)

        return JsonResponse({'message': 'User registered successfully'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Login
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
            return JsonResponse({'message': 'Login successful'})
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def logout_user(request):
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


# Pages
def login_page(request):
    return render(request, 'core/login.html')

def register_page(request):
    return render(request, 'core/register.html')

@login_required
def profile_page(request):
    return render(request, 'core/profile.html', {'profile': request.user.profile})

@login_required
def appointments_page(request):
    user = request.user

    if not user.is_staff:
        qs = Appointment.objects.filter(user=user)
    else:
        qs = Appointment.objects.all()

    context = {
        "total_appointments": qs.count(),
        "pending_appointments": qs.filter(status="PENDING").count(),
        "completed_appointments": qs.filter(status="COMPLETED").count(),
        "cancelled_appointments": qs.filter(status="REJECTED").count(),
    }

    return render(request, "core/appointments.html", context)


# Appointment APIs
@login_required
@require_POST
def create_appointment(request):
    try:
        data = json.loads(request.body)
        appointment = Appointment.objects.create(
            user=request.user,
            service_type=data['service_type'],
            appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
            appointment_time=datetime.strptime(data['appointment_time'], '%H:%M').time(),
            notes=data.get('notes', '')
        )
        return JsonResponse({'message': 'Appointment created successfully', 'appointment_id': appointment.id})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def list_appointments(request):
    if request.user.is_staff:
        appointments = Appointment.objects.all()
    else:
        appointments = Appointment.objects.filter(user=request.user)
    data = [
        {
            'id': a.id,
            'service_type': a.service_type,
            'appointment_date': a.appointment_date.strftime('%Y-%m-%d'),
            'appointment_time': a.appointment_time.strftime('%H:%M'),
            'status': a.status,
            'notes': a.notes or '',
            'is_paid': hasattr(a, 'payment') and a.payment is not None,
        } for a in appointments
    ]
    print(f"User {request.user.email} has {len(data)} appointments")   # ← add this
    return JsonResponse({'appointments': data})

@login_required
@require_POST
def delete_appointment(request, appointment_id):
    try:
        appt = Appointment.objects.get(id=appointment_id, user=request.user)
        appt.delete()
        return JsonResponse({'message': 'Appointment deleted'})
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)


# Payment API
@login_required
@require_POST
def pay_for_appointment(request, appointment_id):
    try:
        data = json.loads(request.body)
        method = data.get('payment_method')
        phone = data.get('phone_number')
        amount = data.get('amount')

        if method not in ['MTN', 'Airtel']:
            return JsonResponse({'error': 'Invalid payment method'}, status=400)

        appointment = Appointment.objects.get(id=appointment_id, user=request.user)
        if hasattr(appointment, 'payment'):
            return JsonResponse({'error': 'Already paid'}, status=400)

        payment = Payment.objects.create(
            appointment=appointment,
            user=request.user,
            payment_method=method,
            phone_number=phone,
            amount=amount
        )
        return JsonResponse({'message': 'Payment successful', 'transaction_id': str(payment.transaction_id)})

    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
