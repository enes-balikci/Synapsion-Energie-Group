// Simulated secure frontend – replace with real API in production
const loginForm = document.getElementById("login-form");
const mfaSection = document.getElementById("mfa-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginError = document.getElementById("login-error");
const mfaError = document.getElementById("mfa-error");
const userEmailElem = document.getElementById("user-email");
const activityLog = document.getElementById("activity-log");
const logoutBtn = document.getElementById("logout-btn");

let tempEmail = "";
let tempToken = "";
let tempUserId = "";

function showError(elem, msg) {
  elem.textContent = msg;
  elem.classList.add("active");
}
function hideError(elem) {
  elem.textContent = "";
  elem.classList.remove("active");
}

// Simulated backend API endpoints (replace with real fetch in prod)
async function apiLogin(email, password, remember) {
  // Security: never expose real password checks on frontend!
  // Simulate: if email ends with @synapsion.com and 8+ password, allow
  if(email.endsWith("@synapsion.com") && password.length >= 8) {
    tempUserId = btoa(email);
    // Simulate JWT
    tempToken = "jwt." + Math.random().toString(36).substring(2);
    // Simulate required MFA for all users
    return { mfaRequired: true, email };
  } else {
    throw new Error("Échec de connexion. Vérifiez vos informations.");
  }
}
async function apiMfaVerify(code) {
  // Simulate 2FA: code '123456' is valid
  if (code === "123456") {
    return { success: true, jwt: tempToken, email: atob(tempUserId) };
  } else {
    throw new Error("Code MFA invalide.");
  }
}
async function apiGetActivity(jwt) {
  // Simulate activity log (would be fetched with secure JWT in real system)
  return [
    { time: "2025-06-15 23:08", action: "Connexion réussie" },
    { time: "2025-06-15 23:10", action: "Consultation du tableau de bord" },
    { time: "2025-06-15 23:12", action: "Déconnexion" }
  ];
}

// Login form handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError(loginError);
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const remember = loginForm.remember.checked;
  try {
    const resp = await apiLogin(email, password, remember);
    tempEmail = email;
    loginForm.style.display = "none";
    mfaSection.classList.remove("hidden");
    hideError(mfaError);
  } catch (err) {
    showError(loginError, err.message || "Erreur inconnue.");
  }
});

// MFA handler
document.getElementById("mfa-submit").addEventListener("click", async () => {
  hideError(mfaError);
  const code = document.getElementById("mfa").value.trim();
  try {
    const resp = await apiMfaVerify(code);
    // Show dashboard
    mfaSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    userEmailElem.textContent = resp.email;
    // Load activity log
    const logs = await apiGetActivity(resp.jwt);
    activityLog.innerHTML = "";
    logs.forEach(log => {
      const li = document.createElement("li");
      li.textContent = `[${log.time}] ${log.action}`;
      activityLog.appendChild(li);
    });
    // Simulate HttpOnly/Secure cookie: only accessible by backend; here, for demo, we store in JS
    sessionStorage.setItem("jwt", resp.jwt);
  } catch (err) {
    showError(mfaError, err.message || "Erreur MFA.");
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("jwt");
  dashboardSection.classList.add("hidden");
  loginForm.style.display = "";
  mfaSection.classList.add("hidden");
  loginForm.reset();
  tempEmail = "";
  tempUserId = "";
  tempToken = "";
});

// Anomaly/Event tracking (example: failed login, repeated MFA error, etc.)
let failedLoginAttempts = 0, failedMfaAttempts = 0;
loginForm.addEventListener("submit", () => { failedLoginAttempts++; });
document.getElementById("mfa-submit").addEventListener("click", () => { failedMfaAttempts++; });
window.addEventListener("beforeunload", () => {
  // Send anomaly log to backend (replace with real API):
  if (failedLoginAttempts > 2 || failedMfaAttempts > 2) {
    navigator.sendBeacon && navigator.sendBeacon("/api/secure-anomaly", JSON.stringify({
      failedLoginAttempts, failedMfaAttempts, ts: Date.now()
    }));
  }
});
