
// create appointments
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("appointmentForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            service_type: document.getElementById("service_type").value,
            appointment_date: document.getElementById("appointment_date").value,
            appointment_time: document.getElementById("appointment_time").value,
            notes: document.getElementById("notes").value
        };

        const response = await fetch("/api/create-appointment/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("apptMessage").textContent = data.message;
        } else {
            document.getElementById("apptMessage").textContent = data.error;
        }
    });
});

// display form when "Book Appointment" clicked
document.addEventListener('DOMContentLoaded', () => {
    const bookButtons = document.querySelectorAll('.book-btn');
    const appointmentForm = document.getElementById('appointmentForm');
    const serviceTypeInput = document.getElementById('serviceType');
    const cancelBookingBtn = document.getElementById('cancelBooking');

    let currentServiceCard = null;

    bookButtons.forEach(button => {
        button.addEventListener('click', () => {
            const serviceCard = button.closest('.service-card');
            const serviceName = serviceCard.dataset.service;

            // Move form under this service card
            serviceCard.insertAdjacentElement('afterend', appointmentForm);
            serviceTypeInput.value = serviceName;

            // Show form
            appointmentForm.style.display = 'block';

            currentServiceCard = serviceCard;
        });
    });

    cancelBookingBtn.addEventListener('click', () => {
        // Hide the form
        appointmentForm.style.display = 'none';
        serviceTypeInput.value = '';
        currentServiceCard = null;
    });

    // Optional: handle submission
    document.getElementById('submitBooking').addEventListener('click', () => {
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const notes = document.getElementById('notes').value;
        const service = serviceTypeInput.value;

        if (!date || !time) {
            alert('Please select date and time');
            return;
        }

        // Here you can send an AJAX request to Django to save the appointment
        console.log(`Booking ${service} on ${date} at ${time}. Notes: ${notes}`);

        // Hide form after booking
        appointmentForm.style.display = 'none';
        serviceTypeInput.value = '';
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector(".apppointments tbody");
    if (!tableBody) return;

    try {
        const response = await fetch("/api/appointments/");
        const data = await response.json();

        if (!response.ok) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color:red;">
                        ${data.error || 'Failed to load appointments'}
                    </td>
                </tr>
            `;
            return;
        }

        if (!data.appointments || data.appointments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No appointments found
                    </td>
                </tr>
            `;
            return;
        }

        // clear table & add extra columns (Manage + Payment)
        tableBody.innerHTML = "";

        data.appointments.forEach(appt => {
       
            let manageButtons = `
                <button onclick="editAppointment(${appt.id})">Update</button>
                <button onclick="deleteAppointment(${appt.id})">Delete</button>
            `;

            
            let paymentButton = "";

            if (appt.status === "PENDING") {
                paymentButton = `
                    <button class="pay-btn"
                        onclick="makePayment(${appt.id})">
                        Pay (MTN / Airtel)
                    </button>
                `;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${appt.service_type}</td>
                <td>${appt.appointment_date}</td>
                <td>${appt.appointment_time}</td>
                <td>${appt.status}</td>
                <td>${appt.notes}</td>
                <td>${manageButtons}</td>      <!-- NEW -->
                <td>${paymentButton}</td>     <!-- NEW -->
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:red;">
                    Error loading appointments
                </td>
            </tr>
        `;
        console.error(err);
    }
});


function editAppointment(id) {
    alert("Edit appointment " + id);
    // Later: open modal or form
}

async function deleteAppointment(id) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    const response = await fetch(`/api/delete-appointment/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") }
    });

    const data = await response.json();
    alert(data.message || "Deleted");
    location.reload();
}

async function makePayment(appointmentId) {
    const method = prompt("Enter payment method: MTN or AIRTEL");

    if (!method) return;

    const response = await fetch(`/api/pay/${appointmentId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ method })
    });

    const data = await response.json();
    alert(data.message);
    location.reload();
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
