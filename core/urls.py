from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),

    # Appointments pages & APIs
    # Web pages
    path('login-page/', views.login_page, name='login_page'),
    path('register-page/', views.register_page, name='register_page'),
    path('profile-page/', views.profile_page, name='profile_page'),
    path('appointments-page/', views.appointments_page, name='appointments_page'),  # HTML page
    path('appointments/', views.list_appointments, name='list_appointments'),       # API: list appointments
    path('create-appointment/', views.create_appointment, name='create_appointment'),  # API: create
    path('delete-appointment/<int:appointment_id>/', views.delete_appointment, name='delete_appointment'),  # API: delete
    path('pay/<int:appointment_id>/', views.pay_for_appointment, name='pay_for_appointment'),               # API: pay

    # Admin updates appointment status
    path('appointments/<int:appointment_id>/update/', views.update_appointment, name='update_appointment'),

    # Optional: admin dashboard page
    # path('admin-dashboard-page/', views.admin_dashboard_page, name='admin_dashboard_page'),
]
