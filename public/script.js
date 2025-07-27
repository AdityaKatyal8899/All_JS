let currentStep = 1;

function nextStep() {
    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const next = document.querySelector(`.form-step[data-step="${currentStep + 1}"]`);
    const currentIndicator = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    const nextIndicator = document.querySelector(`.progress-step[data-step="${currentStep + 1}"]`);

    if (!validateStep(currentStep)) return;

    if (current && next) {
        current.classList.remove('active');
        next.classList.add('active');
        currentIndicator.classList.remove('active');
        currentIndicator.classList.add('completed');
        nextIndicator.classList.add('active');
        currentStep++;
    }
}

function prevStep() {
    const current = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const prev = document.querySelector(`.form-step[data-step="${currentStep - 1}"]`);
    const currentIndicator = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    const prevIndicator = document.querySelector(`.progress-step[data-step="${currentStep - 1}"]`);

    if (current && prev) {
        current.classList.remove('active');
        prev.classList.add('active');
        currentIndicator.classList.remove('active');
        prevIndicator.classList.remove('completed');
        prevIndicator.classList.add('active');
        currentStep--;
    }
}

function validateStep(step) {
    if (step === 1) {
        const name = document.getElementById("name").value.trim();
        if (name === "") {
            alert("Please enter your full name.");
            return false;
        }
    }

    if (step === 2) {
        const phone = document.getElementById("phone").value.replace(/\s+/g, '');
        if (!/^\d{10}$/.test(phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return false;
        }
    }

    return true;
}

// Handle final form submission
document.getElementById("signup-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.replace(/\s+/g, '');
    const slot = document.querySelector('input[name="timeSlot"]:checked');

    if (!slot) {
        alert("Please select a time slot.");
        return;
    }

    const slotValue = slot.value;

    fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, phone, slot: slotValue })
    })
        .then(res => res.json())
        .then(data => {
            console.log("✅ Server Response:", data.message);
            document.getElementById("success-popup").style.display = "flex";
        })
        .catch(err => {
            console.error("❌ Error sending data to server:", err);
            alert("Something went wrong while saving your details.");
        });
});

function closePopup() {
    document.getElementById("success-popup").style.display = "none";
}

// Optional: Format phone number in real-time
const phoneInput = document.getElementById("phone");
phoneInput.addEventListener("input", () => {
    let digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
        phoneInput.value = `${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else {
        phoneInput.value = digits;
    }
});
