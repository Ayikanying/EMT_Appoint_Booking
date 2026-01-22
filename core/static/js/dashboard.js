document.addEventListener("DOMContentLoaded", () => {
    initBookingForm();
    loadAppointments();
});

/* ===============================
   BOOKING FORM LOGIC
=============================== */
function initBookingForm() {

    const form = document.getElementById("appointmentForm");
    if (!form) return;

    const serviceInput = document.getElementById("service_type");
    const dateInput = document.getElementById("appointment_date");
    const timeInput = document.getElementById("appointment_time");
    const notesInput = document.getElementById("notes");
    const cancelBtn = document.getElementById("cancelBooking");

    // Show form
    document.querySelectorAll(".book-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".service-card");

            serviceInput.value = card.dataset.service;
            form.style.display = "block";
            card.insertAdjacentElement("afterend", form);
        });
    });

    // Cancel
    cancelBtn.addEventListener("click", () => {
        form.reset();
        form.style.display = "none";
    });

    // Submit
    form.addEventListener("submit", async e => {
        e.preventDefault();

        if (!serviceInput.value) {
            alert("Please select a service");
            return;
        }

        if (!dateInput.value || !timeInput.value) {
            alert("Please select date and time");
            return;
        }

        const payload = {
            service_type: serviceInput.value,
            appointment_date: dateInput.value,
            appointment_time: timeInput.value,
            notes: notesInput.value
        };

        try {
            const response = await fetch("/api/create-appointment/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            alert(data.message || data.error);

            if (response.ok) {
                form.reset();
                form.style.display = "none";
                loadAppointments();
            }

        } catch (err) {
            console.error(err);
            alert("Failed to create appointment");
        }
    });
}

/* ===============================
   LOAD APPOINTMENTS
=============================== */
async function loadAppointments() {

    const tableBody = document.querySelector(".apppointments tbody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                Loading...
            </td>
        </tr>
    `;

    try {
        const response = await fetch("/api/appointments/");
        const data = await response.json();

        if (!response.ok || !data.appointments?.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No appointments found
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = "";

        data.appointments.forEach(appt => {
            const row = document.createElement("tr");

            const paymentBtn =
                appt.status === "PENDING"
                    ? `<button onclick="makePayment(${appt.id})">Pay</button>`
                    : "-";

            row.innerHTML = `
                <td>${appt.service_type}</td>
                <td>${appt.appointment_date}</td>
                <td>${appt.appointment_time}</td>
                <td>${appt.status}</td>
                <td>${appt.notes || "-"}</td>
                <td>
                    <button onclick="editAppointment(${appt.id})">Edit</button>
                    <button onclick="deleteAppointment(${appt.id})">Delete</button>
                </td>
                <td>${paymentBtn}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:red;">
                    Failed to load appointments
                </td>
            </tr>
        `;
    }
}

/* ===============================
   PAYMENT
========================A======= */
async function makePayment(appointmentId) {

    const method = prompt("Choose payment method: MTN or AIRTEL");
    if (!method) return;

    const paymentMethod = method.trim().toUpperCase();
    if (!["MTN", "AIRTEL"].includes(paymentMethod)) {
        alert("Invalid payment method");
        return;
    }

    try {
        const response = await fetch(`/api/pay/${appointmentId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ payment_method: paymentMethod })
        });

        const data = await response.json();
        alert(data.message || data.error);

        if (response.ok) loadAppointments();

    } catch (err) {
        console.error(err);
        alert("Payment failed");
    }
}

/* ===============================
   HELPERS
=============================== */
function editAppointment(id) {
    alert("Edit appointment " + id);
}

async function deleteAppointment(id) {
    if (!confirm("Delete appointment?")) return;

    try {
        const res = await fetch(`/api/delete-appointment/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") }
        });

        const data = await res.json();
        alert(data.message || "Deleted");
        if (res.ok) loadAppointments();

    } catch (err) {
        console.error(err);
        alert("Delete failed");
    }
}

function getCookie(name) {
    let cookieValue = null;
    document.cookie.split(";").forEach(cookie => {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        }
    });
    return cookieValue;
}
