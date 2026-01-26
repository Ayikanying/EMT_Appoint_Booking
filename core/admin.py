from django.contrib import admin
from .models import Appointment
from .models import Profile, Payment

# Register your models here.

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'service_type',
        'appointment_date',
        'appointment_time',
        'status',
        'created_at'
    )

    list_filter = ('status', 'service_type')
    search_fields = ('user__username', 'service_type')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'role',
        'phone_number',
        'speciality',
        'hospital_id'
    )

    list_filter = ('role',)
    search_fields = ('user__username', 'phone_number', 'speciality', 'hospital_id')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'appointment', 'payment_method', 'phone_number', 'amount', 'transaction_id', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('user__username', 'transaction_id', 'phone_number')
