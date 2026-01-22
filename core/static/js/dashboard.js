document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("appointmentForm");
    if (!form) return;

    const serviceInput = document.getElementById("service_type");
    const dateInput = document.getElementById("appointment_date");
    const timeInput = document.getElementById("appointment_time");
    const notesInput = document.getElementById("notes");
    const cancelBtn = document.getElementById("cancelBooking");

    /* ===============================
       SHOW FORM WHEN BOOK CLICKED
    =============================== */
    document.querySelectorAll(".book-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".service-card");
            serviceInput.value = card.dataset.service;

            card.insertAdjacentElement("afterend", form);
            form.style.display = "block";
        });
    });

    /* ===============================
       CANCEL BOOKING
    =============================== */
    cancelBtn.addEventListener("click", () => {
        form.reset();
        form.style.display = "none";
    });

    /* ===============================
       SUBMIT APPOINTMENT
    =============================== */
    form.addEventListener("submit", async e => {
        e.preventDefault();

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
            location.reload();
        }
    });
});


/* ===============================
   LOAD APPOINTMENTS TABLE
=============================== */
document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector(".apppointments tbody");
    if (!tableBody) return;

    try {
        const response = await fetch("/api/appointments/");
        const data = await response.json();

        if (!response.ok || !data.appointments.length) {
            tableBody.innerHTML = `
                <tr><td colspan="7" style="text-align:center;">No appointments found</td></tr>
            `;
            return;
        }

        tableBody.innerHTML = "";

        data.appointments.forEach(appt => {

            const manageButtons = `
                <button onclick="editAppointment(${appt.id})">Update</button>
                <button onclick="deleteAppointment(${appt.id})">Delete</button>
            `;

            const paymentButton =
                appt.status === "PENDING"
                    ? `<button onclick="makePayment(${appt.id})">Pay (MTN / Airtel)</button>`
                    : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${appt.service_type}</td>
                <td>${appt.appointment_date}</td>
                <td>${appt.appointment_time}</td>
                <td>${appt.status}</td>
                <td>${appt.notes}</td>
                <td>${manageButtons}</td>
                <td>${paymentButton}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
    }
});


/* ===============================
   PAYMENT
=============================== */
async function makePayment(appointmentId) {
    const method = prompt("Enter payment method: MTN or AIRTEL");
    if (!method) return;

    const response = await fetch(`/api/pay/${appointmentId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ payment_method: method })
    });

    const data = await response.json();
    alert(data.message || data.error);
    location.reload();
}


/* ===============================
   HELPERS
=============================== */
function editAppointment(id) {
    alert("Edit appointment " + id);
}

async function deleteAppointment(id) {
    if (!confirm("Delete appointment?")) return;

    const res = await fetch(`/api/delete-appointment/${id}/`, {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") }
    });

    const data = await res.json();
    alert(data.message || "Deleted");
    location.reload();
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
