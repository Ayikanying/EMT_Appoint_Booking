from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
    ROLE_CHOICES = (
        ('doctor', 'Doctor'),
        ('patient', 'Patient')
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone_number = models.CharField(max_length=15, blank=True)
    speciality = models.CharField(max_length=100, blank=True) # Only for doctors
    hospital_id = models.CharField(max_length=50, blank=True) # Only for doctors

    def __self__(self):
        return f'{self.user.username} ({self.role})'

class Appointment(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    user = models.ForeignKey(
        User,
        on_delete = models.CASCADE,
        related_name = 'appointments'
    )
    service_type = models.CharField(max_length=100)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    status = models.CharField(
        max_length = 20,
        choices = STATUS_CHOICES,
        default = 'PENDING'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.service_type} ({self.status})"
    

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('MTN', 'MTN Mobile Money'),
        ('AIRTEL', 'Airtel Money'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)