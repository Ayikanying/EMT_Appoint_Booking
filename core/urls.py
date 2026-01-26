from django.urls import path
from . import views

urlpatterns = [
    # Auth APIs
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),

    # HTML pages
    path('login-page/', views.login_page, name='login_page'),
    path('register-page/', views.register_page, name='register_page'),
    path('profile-page/', views.profile_page, name='profile_page'),
    path('appointments-page/', views.appointments_page, name='appointments_page'),

    # Appointment APIs
    path('appointments/', views.list_appointments, name='list_appointments'),
    path('create-appointment/', views.create_appointment, name='create_appointment'),
    path('delete-appointment/<int:appointment_id>/', views.delete_appointment, name='delete_appointment'),
    path('pay/<int:appointment_id>/', views.pay_for_appointment, name='pay_for_appointment'),
]
