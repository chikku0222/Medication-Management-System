// ==========================================
// MEDICATION MANAGEMENT SYSTEM
// ==========================================

// ---------- LOAD DATA FROM LOCAL STORAGE ----------

function loadStoredData(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : fallback;
    } catch (error) {
        return fallback;
    }
}

let users = loadStoredData("users", [
    {
        name: "Administrator",
        username: "admin",
        password: "admin123",
        role: "ADMIN"
    },
    {
        name: "Staff One",
        username: "staff1",
        password: "staff123",
        role: "CARE_STAFF"
    }
]);

let residents = loadStoredData("residents", []);
let medicines = loadStoredData("medicines", []);
let records = loadStoredData("records", []);
let assignedMedicines = loadStoredData("assignedMedicines", []);

let adminUser = null;
let staffUser = null;


// ---------- SAVE DATA ----------

function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("residents", JSON.stringify(residents));
    localStorage.setItem("medicines", JSON.stringify(medicines));
    localStorage.setItem("records", JSON.stringify(records));
    localStorage.setItem("assignedMedicines", JSON.stringify(assignedMedicines));
}


// ---------- LOGIN ----------

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const user = users.find(function (item) {
            return item.username === username && item.password === password;
        });

        const message = document.getElementById("loginMessage");

        if (!user) {
            if (message) {
                message.textContent = "Invalid username or password.";
            }
            return;
        }

        sessionStorage.setItem("loggedInUser", JSON.stringify(user));

        if (user.role === "ADMIN") {
            window.location.href = "admin.html";
        } else if (user.role === "CARE_STAFF") {
            window.location.href = "staff.html";
        } else {
            if (message) {
                message.textContent = "Invalid user role.";
            }
        }
    });
}


// ---------- CHECK LOGIN ----------

function checkLogin(requiredRole) {
    let loggedInUser = null;

    try {
        loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    } catch (error) {
        loggedInUser = null;
    }

    if (!loggedInUser || loggedInUser.role !== requiredRole) {
        window.location.href = "login.html";
        return null;
    }

    return loggedInUser;
}


// ---------- LOGOUT ----------

function logout() {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}


// ---------- COMMON HELPERS ----------

function getCurrentDateTime() {
    return new Date().toLocaleString();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// ==========================================
// ADMIN DASHBOARD
// ==========================================

function loadAdminDashboard() {
    displayAdminStaff();
    displayAdminResidents();
    populateAssignmentDropdowns();
    displayAssignments();
    populateMedicineResidentDropdown();
    displayAssignedMedicines();
    displayMedicationRecords();

    const residentCount = document.getElementById("adminResidentCount");
    const staffCount = document.getElementById("adminStaffCount");
    const recordCount = document.getElementById("adminRecordCount");

    if (residentCount) {
        residentCount.textContent = residents.length;
    }

    if (staffCount) {
        staffCount.textContent = users.filter(user => user.role === "CARE_STAFF").length;
    }

    if (recordCount) {
        recordCount.textContent = records.length;
    }
}


// ---------- CREATE CARE STAFF ACCOUNT ----------

const staffForm = document.getElementById("staffForm");

if (staffForm) {
    staffForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("staffName").value.trim();
        const username = document.getElementById("staffUsername").value.trim();
        const password = document.getElementById("staffPassword").value;

        if (!name || !username || !password) {
            alert("Please fill in all staff details.");
            return;
        }

        const usernameExists = users.some(function (user) {
            return user.username.toLowerCase() === username.toLowerCase();
        });

        if (usernameExists) {
            alert("This username already exists.");
            return;
        }

        users.push({
            name: name,
            username: username,
            password: password,
            role: "CARE_STAFF"
        });

        saveData();
        staffForm.reset();

        displayAdminStaff();
        populateAssignmentDropdowns();

        const count = document.getElementById("adminStaffCount");
        if (count) {
            count.textContent = users.filter(user => user.role === "CARE_STAFF").length;
        }

        alert("Care Staff account created successfully!");
    });
}


// ---------- DISPLAY CARE STAFF ----------

function displayAdminStaff() {
    const staffList = document.getElementById("adminStaffList");

    if (!staffList) return;

    const staffMembers = users.filter(user => user.role === "CARE_STAFF");

    staffList.innerHTML = "";

    if (staffMembers.length === 0) {
        staffList.innerHTML = "<li>No Care Staff accounts created.</li>";
        return;
    }

    staffMembers.forEach(function (staff) {
        const li = document.createElement("li");

        li.textContent = staff.name + " (" + staff.username + ")";
        staffList.appendChild(li);
    });
}


// ---------- REGISTER RESIDENT ----------

const adminResidentForm = document.getElementById("adminResidentForm");

if (adminResidentForm) {
    adminResidentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("adminResidentName").value.trim();
        const age = Number(document.getElementById("adminResidentAge").value);

        if (!name || !Number.isInteger(age) || age < 1 || age > 120) {
            alert("Please enter valid resident details.");
            return;
        }

        residents.push({
            name: name,
            age: age,
            assignedTo: ""
        });

        saveData();
        adminResidentForm.reset();

        displayAdminResidents();
        populateAssignmentDropdowns();
        populateMedicineResidentDropdown();

        const count = document.getElementById("adminResidentCount");
        if (count) {
            count.textContent = residents.length;
        }

        alert("Resident registered successfully!");
    });
}


// ---------- DISPLAY RESIDENTS ----------

function displayAdminResidents() {
    const residentList = document.getElementById("adminResidentList");

    if (!residentList) return;

    residentList.innerHTML = "";

    if (residents.length === 0) {
        residentList.innerHTML = "<li>No residents registered.</li>";
        return;
    }

    residents.forEach(function (resident) {
        const li = document.createElement("li");

        li.textContent = resident.name + " - Age: " + resident.age;
        residentList.appendChild(li);
    });
}


// ---------- POPULATE ASSIGNMENT DROPDOWNS ----------

function populateAssignmentDropdowns() {
    const residentSelect = document.getElementById("assignmentResident");
    const staffSelect = document.getElementById("assignmentStaff");

    if (residentSelect) {
        residentSelect.innerHTML = '<option value="">Select Resident</option>';

        residents.forEach(function (resident, index) {
            const option = document.createElement("option");

            option.value = index;
            option.textContent = resident.name;

            residentSelect.appendChild(option);
        });
    }

    if (staffSelect) {
        staffSelect.innerHTML = '<option value="">Select Care Staff</option>';

        users.filter(user => user.role === "CARE_STAFF").forEach(function (staff) {
            const option = document.createElement("option");

            option.value = staff.username;
            option.textContent = staff.name + " (" + staff.username + ")";

            staffSelect.appendChild(option);
        });
    }
}


// ---------- ASSIGN RESIDENT TO STAFF ----------

const assignmentForm = document.getElementById("assignmentForm");

if (assignmentForm) {
    assignmentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const residentIndex = document.getElementById("assignmentResident").value;
        const staffUsername = document.getElementById("assignmentStaff").value;

        if (residentIndex === "" || !staffUsername) {
            alert("Please select a resident and Care Staff member.");
            return;
        }

        const resident = residents[Number(residentIndex)];

        if (!resident) {
            alert("Resident not found.");
            return;
        }

        resident.assignedTo = staffUsername;

        saveData();
        assignmentForm.reset();

        displayAssignments();
        populateAssignmentDropdowns();

        alert("Resident assigned successfully!");
    });
}


// ---------- DISPLAY ASSIGNMENTS ----------

function displayAssignments() {
    const assignmentList = document.getElementById("adminAssignmentList");

    if (!assignmentList) return;

    assignmentList.innerHTML = "";

    const assignedResidents = residents.filter(resident => resident.assignedTo);

    if (assignedResidents.length === 0) {
        assignmentList.innerHTML = "<li>No resident assignments yet.</li>";
        return;
    }

    assignedResidents.forEach(function (resident) {
        const staff = users.find(user => user.username === resident.assignedTo);

        const li = document.createElement("li");

        li.textContent = resident.name + " → " + (staff ? staff.name : resident.assignedTo);

        assignmentList.appendChild(li);
    });
}


// ---------- POPULATE MEDICINE RESIDENT DROPDOWN ----------

function populateMedicineResidentDropdown() {
    const residentSelect = document.getElementById("medicineResident");

    if (!residentSelect) return;

    residentSelect.innerHTML = '<option value="">Select Resident</option>';

    residents.forEach(function (resident, index) {
        const option = document.createElement("option");

        option.value = index;
        option.textContent = resident.name;

        residentSelect.appendChild(option);
    });
}


// ---------- ASSIGN MEDICINE TO RESIDENT ----------

const residentMedicineForm = document.getElementById("residentMedicineForm");

if (residentMedicineForm) {
    residentMedicineForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const residentIndex = document.getElementById("medicineResident").value;
        const name = document.getElementById("assignedMedicineName").value.trim();
        const dosage = document.getElementById("assignedMedicineDosage").value.trim();
        const time = document.getElementById("assignedMedicineTime").value;

        if (residentIndex === "" || !name || !dosage || !time) {
            alert("Please fill in all medicine details.");
            return;
        }

        const resident = residents[Number(residentIndex)];

        if (!resident) {
            alert("Please select a valid resident.");
            return;
        }

        assignedMedicines.push({
            resident: resident.name,
            name: name,
            dosage: dosage,
            time: time,
            status: "Pending",
            reason: ""
        });

        saveData();
        residentMedicineForm.reset();

        displayAssignedMedicines();

        alert("Medicine assigned successfully!");
    });
}


// ---------- DISPLAY ASSIGNED MEDICINES (ADMIN) ----------

function displayAssignedMedicines() {
    const medicineList = document.getElementById("assignedMedicineList");

    if (!medicineList) return;

    medicineList.innerHTML = "";

    if (assignedMedicines.length === 0) {
        medicineList.innerHTML = "<tr><td colspan='5'>No medicines assigned.</td></tr>";
        return;
    }

    assignedMedicines.forEach(function (medicine) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(medicine.resident)}</td>
            <td>${escapeHTML(medicine.name)}</td>
            <td>${escapeHTML(medicine.dosage)}</td>
            <td>${escapeHTML(medicine.time)}</td>
            <td>${escapeHTML(medicine.status || "Pending")}</td>
        `;

        medicineList.appendChild(row);
    });
}


// ---------- DISPLAY MEDICATION RECORDS (ADMIN) ----------

function displayMedicationRecords() {
    const recordList = document.getElementById("adminMedicationRecords");

    if (!recordList) return;

    recordList.innerHTML = "";

    if (records.length === 0) {
        recordList.innerHTML = "<tr><td colspan='6'>No medication records yet.</td></tr>";
        return;
    }

    records.slice().reverse().forEach(function (record) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(record.resident)}</td>
            <td>${escapeHTML(record.medicine)}</td>
            <td>${escapeHTML(record.action)}</td>
            <td>${escapeHTML(record.reason || "-")}</td>
            <td>${escapeHTML(record.staff)}</td>
            <td>${escapeHTML(record.time)}</td>
        `;

        recordList.appendChild(row);
    });
}


// ==========================================
// CARE STAFF DASHBOARD
// ==========================================

function loadStaffDashboard() {
    displayStaffResidents();
    displayStaffMedicines();
    populateStatusMedicineDropdown();
    displayStaffActivity();

    const myResidents = residents.filter(function (resident) {
        return resident.assignedTo === staffUser.username;
    });

    const myMedicines = assignedMedicines.filter(function (medicine) {
        return myResidents.some(resident => resident.name === medicine.resident);
    });

    const patientCount = document.getElementById("staffPatientCount");
    const pendingCount = document.getElementById("staffPendingCount");
    const givenCount = document.getElementById("staffGivenCount");

    if (patientCount) {
        patientCount.textContent = myResidents.length;
    }

    if (pendingCount) {
        pendingCount.textContent = myMedicines.filter(
            medicine => (medicine.status || "Pending") === "Pending"
        ).length;
    }

    if (givenCount) {
        givenCount.textContent = records.filter(function (record) {
            return record.staff === staffUser.username && record.action === "Given";
        }).length;
    }
}


// ---------- DISPLAY ASSIGNED RESIDENTS (STAFF) ----------

function displayStaffResidents() {
    const residentList = document.getElementById("staffPatientList");

    if (!residentList) return;

    residentList.innerHTML = "";

    const myResidents = residents.filter(function (resident) {
        return resident.assignedTo === staffUser.username;
    });

    if (myResidents.length === 0) {
        residentList.innerHTML = "<li>No residents assigned to you.</li>";
        return;
    }

    myResidents.forEach(function (resident) {
        const li = document.createElement("li");

        li.textContent = resident.name + " - Age: " + resident.age;

        residentList.appendChild(li);
    });
}


// ---------- DISPLAY STAFF MEDICATION SCHEDULE ----------

function displayStaffMedicines() {
    const medicineList = document.getElementById("staffMedicineList");

    if (!medicineList) return;

    medicineList.innerHTML = "";

    const myResidents = residents.filter(function (resident) {
        return resident.assignedTo === staffUser.username;
    });

    const myMedicines = assignedMedicines
        .map(function (medicine, index) {
            return { ...medicine, originalIndex: index };
        })
        .filter(function (medicine) {
            return myResidents.some(resident => resident.name === medicine.resident);
        });

    if (myMedicines.length === 0) {
        medicineList.innerHTML = "<tr><td colspan='6'>No medicines assigned to your residents.</td></tr>";
        return;
    }

    myMedicines.forEach(function (medicine) {
        const row = document.createElement("tr");

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Record Status";
        button.addEventListener("click", function () {
            selectMedicineForStatus(medicine.originalIndex);
        });

        const cells = [
            medicine.resident,
            medicine.name,
            medicine.dosage,
            medicine.time,
            medicine.status || "Pending"
        ];

        cells.forEach(function (value) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        actionCell.appendChild(button);
        row.appendChild(actionCell);

        medicineList.appendChild(row);
    });
}


// ---------- POPULATE STATUS MEDICINE DROPDOWN ----------

function populateStatusMedicineDropdown() {
    const medicineSelect = document.getElementById("statusMedicine");

    if (!medicineSelect) return;

    const previousValue = medicineSelect.value;

    medicineSelect.innerHTML = '<option value="">Select Medicine</option>';

    const myResidents = residents.filter(function (resident) {
        return resident.assignedTo === staffUser.username;
    });

    assignedMedicines.forEach(function (medicine, index) {
        const residentIsAssigned = myResidents.some(function (resident) {
            return resident.name === medicine.resident;
        });

        if (!residentIsAssigned) return;

        const option = document.createElement("option");

        option.value = index;
        option.textContent =
            medicine.resident + " - " + medicine.name + " (" + medicine.time + ")";

        medicineSelect.appendChild(option);
    });

    if (previousValue !== "" &&
        Array.from(medicineSelect.options).some(option => option.value === previousValue)) {
        medicineSelect.value = previousValue;
    }
}


// ---------- SELECT MEDICINE TO RECORD ----------

function selectMedicineForStatus(index) {
    const medicineSelect = document.getElementById("statusMedicine");
    const statusSection = document.getElementById("medication-action");

    if (!medicineSelect) return;

    medicineSelect.value = String(index);

    if (statusSection) {
        statusSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


// ---------- RECORD MEDICATION STATUS ----------

const medicationStatusForm = document.getElementById("medicationStatusForm");

if (medicationStatusForm) {
    medicationStatusForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const medicineIndex = document.getElementById("statusMedicine").value;
        const status = document.getElementById("medicationStatus").value;
        const reason = document.getElementById("medicationReason").value.trim();

        if (medicineIndex === "" || !status) {
            alert("Please select a medicine and medication status.");
            return;
        }

        const medicine = assignedMedicines[Number(medicineIndex)];

        if (!medicine) {
            alert("Medicine not found.");
            return;
        }

        const resident = residents.find(function (item) {
            return item.name === medicine.resident &&
                item.assignedTo === staffUser.username;
        });

        if (!resident) {
            alert("You are not assigned to this resident.");
            return;
        }

        if (["Missed", "Refused", "Delayed"].includes(status) && !reason) {
            alert("Please enter a reason for " + status.toLowerCase() + " medication.");
            return;
        }

        medicine.status = status;
        medicine.reason = reason;

        records.push({
            resident: medicine.resident,
            medicine: medicine.name,
            action: status,
            reason: reason,
            staff: staffUser.username,
            time: getCurrentDateTime()
        });

        saveData();

        medicationStatusForm.reset();

        loadStaffDashboard();
        displayMedicationRecords();

        alert("Medication status recorded successfully!");
    });
}


// ---------- DISPLAY STAFF ACTIVITY ----------

function displayStaffActivity() {
    const activityList = document.getElementById("staffActivityList");

    if (!activityList) return;

    activityList.innerHTML = "";

    const myRecords = records.filter(function (record) {
        return record.staff === staffUser.username;
    }).reverse();

    if (myRecords.length === 0) {
        activityList.innerHTML = "<li>No activity recorded yet.</li>";
        return;
    }

    myRecords.forEach(function (record) {
        const li = document.createElement("li");

        let activity = record.action + " - " +
            record.medicine + " for " + record.resident;

        if (record.reason) {
            activity += " | Reason: " + record.reason;
        }

        activity += " | " + record.time;

        li.textContent = activity;
        activityList.appendChild(li);
    });
}


// ==========================================
// ORIGINAL INDEX.HTML FUNCTIONS
// ==========================================

// ---------- ADD RESIDENT (ORIGINAL PAGE) ----------

const residentForm = document.getElementById("residentForm");

if (residentForm) {
    residentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("residentName").value.trim();
        const age = Number(document.getElementById("residentAge").value);

        if (!name || !Number.isInteger(age) || age < 1 || age > 120) {
            alert("Please enter valid resident details.");
            return;
        }

        residents.push({
            name: name,
            age: age,
            assignedTo: ""
        });

        saveData();
        residentForm.reset();

        displayResidents();
        updateOriginalDashboard();

        alert("Resident added successfully!");
    });
}


// ---------- DISPLAY ORIGINAL RESIDENTS ----------

function displayResidents() {
    const residentList = document.getElementById("residentList");

    if (!residentList) return;

    residentList.innerHTML = "";

    residents.forEach(function (resident) {
        const li = document.createElement("li");

        li.textContent = resident.name + " - Age: " + resident.age;
        residentList.appendChild(li);
    });
}


// ---------- ADD MEDICINE (ORIGINAL PAGE) ----------

const medicineForm = document.getElementById("medicineForm");

if (medicineForm) {
    medicineForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("medicineName").value.trim();
        const dosage = document.getElementById("medicineDosage").value.trim();

        if (!name || !dosage) {
            alert("Please enter medicine details.");
            return;
        }

        medicines.push({
            name: name,
            dosage: dosage,
            status: "Pending"
        });

        saveData();
        medicineForm.reset();

        displayMedicines();
        updateOriginalDashboard();

        alert("Medicine added successfully!");
    });
}


// ---------- DISPLAY ORIGINAL MEDICINES ----------

function displayMedicines() {
    const medicineList = document.getElementById("medicineList");

    if (!medicineList) return;

    medicineList.innerHTML = "";

    medicines.forEach(function (medicine, index) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(medicine.name)}</td>
            <td>${escapeHTML(medicine.dosage)}</td>
            <td>${escapeHTML(medicine.status || "Pending")}</td>
            <td>
                <button type="button" onclick="markAsGiven(${index})">
                    Mark as Given
                </button>
            </td>
        `;

        medicineList.appendChild(row);
    });
}


// ---------- MARK ORIGINAL MEDICINE AS GIVEN ----------

function markAsGiven(index) {
    if (!medicines[index]) return;

    medicines[index].status = "Given";

    records.push({
        resident: "Not specified",
        medicine: medicines[index].name,
        action: "Given",
        reason: "",
        staff: "Admin",
        time: getCurrentDateTime()
    });

    saveData();

    displayMedicines();
    updateOriginalDashboard();
}


// ---------- UPDATE ORIGINAL DASHBOARD ----------

function updateOriginalDashboard() {
    const residentCount = document.getElementById("residentCount");
    const medicineCount = document.getElementById("medicineCount");
    const givenCount = document.getElementById("givenCount");

    if (residentCount) {
        residentCount.textContent = residents.length;
    }

    if (medicineCount) {
        medicineCount.textContent = medicines.length;
    }

    if (givenCount) {
        givenCount.textContent = medicines.filter(
            medicine => medicine.status === "Given"
        ).length;
    }
}


// ==========================================
// START THE CORRECT PAGE
// ==========================================

// IMPORTANT:
// Login checks only run on their respective dashboards.
// Do not run these checks on login.html.

if (document.getElementById("adminResidentCount")) {
    adminUser = checkLogin("ADMIN");

    if (adminUser) {
        loadAdminDashboard();
    }
}

if (document.getElementById("staffPatientCount")) {
    staffUser = checkLogin("CARE_STAFF");

    if (staffUser) {
        loadStaffDashboard();
    }
}

if (document.getElementById("residentForm") ||
    document.getElementById("medicineForm")) {
    displayResidents();
    displayMedicines();
    updateOriginalDashboard();
}