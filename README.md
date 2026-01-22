# 🗓️ Online Appointment & Service Management System

## Project Overview
This project is a **full-stack web application** developed as part of a **Business Technology Apprenticeship** at **E&M Technology House**.

The system solves the problem of **manual appointment booking and long service queues** by allowing users to book appointments online and enabling administrators to manage and track service delivery efficiently.

---

## Problem Statement
Many organizations such as clinics, banks, and service centers rely on manual appointment processes, which lead to:
- Long queues
- Poor appointment tracking
- Lack of transparency for customers and staff

This system provides a **digital solution** for booking, approving, and managing appointments.

---

## Features

###  User Features
- User registration and login
- Book an appointment online
- View appointment status (Pending, Approved, Rejected, Completed)
- Logout securely

### Admin Features
- Admin login
- View all appointments
- Approve, reject, or complete appointments
- Add notes to appointments
- Logout securely

---

## System Architecture
The system follows a standard **frontend-backend architecture**:

- **Frontend**: HTML, CSS, JavaScript (AJAX for dynamic interactions)
- **Backend**: Django (Python) serving REST-like JSON APIs
- **Database**: SQLite for storing users and appointments

Users interact via the web interface, which communicates with Django views that perform CRUD operations on the database.

---

## Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Django (Python) |
| Authentication | Django Sessions |
| Database | SQLite |
| API Style | REST-like JSON APIs |

---

## Database Design

### Users
- Uses Django’s built-in `User` model for secure authentication.

### Appointments
- Linked to users via ForeignKey
- Fields: `service_type`, `appointment_date`, `appointment_time`, `status`, `notes`
- Status lifecycle: `PENDING → APPROVED / REJECTED → COMPLETED`

---

## Security Considerations
- Passwords are securely hashed by Django
- Role-based access control (User vs Admin)
- Session-based authentication
- Admin-only access for appointment approval

---

## How to Run the Project

### Clone or Download the Project
```bash
git clone <https://github.com/Ayikanying/EMT_Appoint_Booking>
cd appointment_system
