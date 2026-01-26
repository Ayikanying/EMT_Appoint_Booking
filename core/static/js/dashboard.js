let selectedAppointmentId = null;

document.addEventListener("DOMContentLoaded", () => {
    initBookingForm();
    loadAppointments();
    initPaymentModal();
});

// ── Booking Form ────────────────────────────────────────────────
function initBookingForm() {
    const form = document.getElementById("appointmentForm");
    if (!form) return;

    const serviceInput = document.getElementById("service_type");
    const dateInput   = document.getElementById("appointment_date");
    const timeInput   = document.getElementById("appointment_time");
    const notesInput  = document.getElementById("notes");
    const cancelBtn   = document.getElementById("cancelBooking");

    // Show form when clicking any "Book" button
    document.querySelectorAll(".book-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".service-card");
            if (!card) return;

            serviceInput.value = card.dataset.service || "";
            form.style.display = "block";
            form.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });

    // Cancel / hide form
    cancelBtn.addEventListener("click", () => {
        form.reset();
        form.style.display = "none";
    });

    // Submit new appointment
    form.addEventListener("submit", async e => {
        e.preventDefault();

        // Very basic client-side validation
        if (!serviceInput.value || !dateInput.value || !timeInput.value) {
            alert("Please fill in service, date and time.");
            return;
        }

        const payload = {
            service_type: serviceInput.value.trim(),
            appointment_date: dateInput.value,
            appointment_time: timeInput.value,
            notes: notesInput.value.trim()
        };

        try {
            const res = await fetch("/api/create-appointment/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Appointment created successfully!");
                form.reset();
                form.style.display = "none";
                loadAppointments();
            } else {
                alert(data.error || "Failed to create appointment");
            }
        } catch (err) {
            console.error(err);
            alert("Network error – could not create appointment");
        }
    });
}

// ── Load Appointments ───────────────────────────────────────────
async function loadAppointments() {
    const tableBody = document.querySelector(".appointments tbody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

    try {
        const res = await fetch("/api/appointments/");
        if (!res.ok) throw new Error("Failed to fetch appointments");

        const data = await res.json();

        tableBody.innerHTML = "";
        if (!data.appointments?.length) {
            tableBody.innerHTML = `<tr><td colspan="7">No appointments found</td></tr>`;
            return;
        }

        data.appointments.forEach(appt => {
            const row = document.createElement("tr");

            // Payment button (created dynamically – no inline onclick)
            let paymentCellContent = appt.is_paid
                ? "Paid"
                : `<button class="pay-btn">Pay</button>`;

            row.innerHTML = `
                <td>${appt.service_type || "-"}</td>
                <td>${appt.appointment_date || "-"}</td>
                <td>${appt.appointment_time || "-"}</td>
                <td>${appt.status || "-"}</td>
                <td>${appt.notes || "-"}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
                <td>${paymentCellContent}</td>
            `;

            // Attach event listeners
            row.querySelector(".edit-btn")?.addEventListener("click", () => editAppointment(appt.id));
            row.querySelector(".delete-btn")?.addEventListener("click", () => deleteAppointment(appt.id));

            const payBtn = row.querySelector(".pay-btn");
            if (payBtn && !appt.is_paid) {
                payBtn.addEventListener("click", () => makePayment(appt.id));
            }

            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="7">Failed to load appointments</td></tr>`;
    }
}

// ── Payment Modal ───────────────────────────────────────────────
function makePayment(id) {
    selectedAppointmentId = id;
    const modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "block";
}

function initPaymentModal() {
    const modal = document.getElementById("paymentModal");
    if (!modal) return;

    const closeBtn    = modal.querySelector(".close");
    const paymentForm = document.getElementById("paymentForm");

    if (!closeBtn || !paymentForm) return;

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        paymentForm.reset();
        selectedAppointmentId = null; // important cleanup
    });

    paymentForm.addEventListener("submit", async e => {
    e.preventDefault();

    // Look for the checked radio button (document-wide, because radios are outside the form)
    const selectedRadio = document.querySelector('input[name="provider"]:checked');

    if (!selectedRadio) {
        alert("Please select a payment provider (Airtel or MTN)");
        return;
    }

    const provider = selectedRadio.value;

    // Get phone and amount
    const phoneInput = paymentForm.querySelector('input[type="text"]');   // #paymentPhone
    const amountInput = paymentForm.querySelector('input[type="number"]'); // #paymentAmount

    const phone = phoneInput?.value?.trim() || "";
    const amount = amountInput?.value?.trim() || "";

    if (!phone) {
        alert("Please enter phone number");
        return;
    }

    if (!amount || Number(amount) <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
    }

    if (!selectedAppointmentId) {
        alert("No appointment selected for payment");
        return;
    }

    try {
        const response = await fetch(`/api/pay/${selectedAppointmentId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({
                payment_method: provider,
                phone_number: phone,
                amount: amount
            })
        });

        const data = await response.json();
        alert(data.message || data.error || (response.ok ? "Success" : "Failed"));

        if (response.ok) {
            document.getElementById("paymentModal").style.display = "none";
            paymentForm.reset();
            // Optional: uncheck radios
            document.querySelectorAll('input[name="provider"]').forEach(r => r.checked = false);
            loadAppointments();
        }

    } catch (err) {
        console.error(err);
        alert("Payment request failed");
    }
});
}

// ── Edit / Delete ───────────────────────────────────────────────
function editAppointment(id) {
    alert(`Edit appointment #${id} – (to be implemented)`);
    // Future: open edit modal, prefill form, send PATCH/PUT request
}

async function deleteAppointment(id) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
        const res = await fetch(`/api/delete-appointment/${id}/`, {
            method: "POST",   // consider DELETE if your backend supports it
            headers: {
                "X-CSRFToken": getCookie("csrftoken")
            }
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || "Appointment deleted");
            loadAppointments();
        } else {
            alert(data.error || "Could not delete appointment");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to delete appointment");
    }
}

// ── Utility ─────────────────────────────────────────────────────
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}