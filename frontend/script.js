const API = "http://127.0.0.1:5000";

/* -------- Load Hospitals -------- */
function loadHospitals(selectId = "hospital_id") {
    fetch(API + "/hospitals")
        .then(res => res.json())
        .then(data => {
            let select = document.getElementById(selectId);
            if (!select) return;

            select.innerHTML = "";
            data.forEach(h => {
                select.innerHTML += `<option value="${h.id}">
                    ${h.name} - ${h.city}
                </option>`;
            });
        });
}

/* -------- Register -------- */
function register() {
    fetch(API + "/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value,
            role: role.value,
            hospital_id: hospital_id.value
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.msg);
        window.location = "login.html";
    });
}

/* -------- Login -------- */
function login() {
    fetch(API + "/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            email: email.value,
            password: password.value
        })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("token", data.access_token);

        if (data.role === "client")
            window.location = "dashboard_client.html";
        else
            window.location = "dashboard_caregiver.html";
    });
}

/* -------- Logout -------- */
function logout() {
    localStorage.removeItem("token");
    window.location = "login.html";
}

/* -------- Create Request -------- */
function createRequest() {
    fetch(API + "/create_request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
            hospital_id: hospital_id.value,
            condition: condition.value,
            days: days.value
        })
    })
    .then(res => res.json())
    .then(data => alert(data.msg));
}

/* -------- Load Requests -------- */
function loadRequests() {
    fetch(API + "/requests/" + hospital_id.value, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => {
        requests.innerHTML = "";
        data.forEach(r => {
            requests.innerHTML += `
                <div class="card">
                    <p><b>Condition:</b> ${r.condition}</p>
                    <p><b>Days:</b> ${r.days}</p>
                    <button onclick="accept(${r.id})">Accept</button>
                </div>
            `;
        });
    });
}

/* -------- Accept -------- */
function accept(id) {
    fetch(API + "/accept/" + id, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => alert(data.msg));
}