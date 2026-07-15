import "./style.css";
import "./logo.css";

const app = document.querySelector("#app");
const localHost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (localHost
    ? "http://localhost:8000"
    : "https://tuitionledger-backend.vercel.app");
const browserId =
  localStorage.getItem("tuitionledger-browser") || crypto.randomUUID();
localStorage.setItem("tuitionledger-browser", browserId);
const params = new URLSearchParams(location.search);
const token = params.get("registration_token");
const attendanceToken = params.get("attendance_token");
const savedRequestKey = "tuitionledger-registration-request";
const subjects = ["Maths", "Science", "English", "Tamil", "History"];
const api = async (path, options = {}) => {
  const r = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.success === false)
    throw new Error(body.message || "Connection problem. Please try again.");
  return body.data;
};

function registration() {
  app.innerHTML = `<main class="student-card"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><p class="eyebrow">STUDENT REGISTRATION</p><h1>Register this browser.</h1><p class="intro">Your tutor will review these details before attendance is enabled.</p>${token ? `<form id="registration"><label>Full name<input name="full_name" autocomplete="name" required placeholder="Enus Caleb"></label><label>Student phone<input name="student_phone" inputmode="tel" required placeholder="0789282834"></label><label>Guardian name<input name="guardian_name" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" inputmode="tel" required></label><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><fieldset><legend>Requested subjects</legend>${subjects.map((s) => `<label class="check-row"><input type="checkbox" name="requested_classes" value="${s}"> ${s}</label>`).join("")}</fieldset><p id="notice" role="status"></p><button class="primary">Request approval</button></form>` : `<p class="inline-notice error">Open this page from the registration QR provided by your tutor.</p>`}</main>`;
  const form = document.querySelector("#registration");
  if (!form) return;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const notice = document.querySelector("#notice");
    const button = form.querySelector("button");
    button.disabled = true;
    notice.textContent = "Sending your request...";
    try {
      const request = await api("/api/register-student", {
        method: "POST",
        body: JSON.stringify({
          registration_token: token,
          full_name: data.get("full_name"),
          student_phone: data.get("student_phone"),
          guardian_name: data.get("guardian_name"),
          guardian_whatsapp: data.get("guardian_whatsapp"),
          grade: data.get("grade"),
          requested_classes: data.getAll("requested_classes"),
          browser_id: browserId,
        }),
      });
      localStorage.setItem(savedRequestKey, request.id);
      notice.textContent = "Request sent. Waiting for tutor approval.";
      notice.className = "success";
      form.reset();
      const poll = window.setInterval(async () => {
        try {
          const state = await api(`/api/registration-requests/${request.id}/status?browser_id=${encodeURIComponent(browserId)}`);
          if (state.status === "Approved") {
            window.clearInterval(poll);
            notice.textContent = `Approved. Your student ID is ${state.student_code}.`;
            notice.className = "success approved";
            button.textContent = "Registration approved";
          } else if (state.status === "Rejected") {
            window.clearInterval(poll);
            notice.textContent = "Registration rejected. Please contact your tutor.";
            notice.className = "error";
            button.disabled = false;
          }
        } catch (_) {
          // Keep the waiting state during short network interruptions.
        }
      }, 3000);
    } catch (error) {
      notice.textContent = error.message;
      notice.className = "error";
      button.disabled = false;
    }
  };
}

function attendance() {
  app.innerHTML = `<main class="student-card result"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><p class="eyebrow">ATTENDANCE</p><h1>Mark attendance.</h1><p class="intro">This approved browser will be checked against the class session.</p><p id="notice" role="status"></p><button id="mark" class="primary">Mark me present</button></main>`;
  document.querySelector("#mark").onclick = async () => {
    const notice = document.querySelector("#notice");
    const button = document.querySelector("#mark");
    button.disabled = true;
    notice.textContent = "Checking your browser...";
    try {
      await api("/api/attendance/scan", {
        method: "POST",
        body: JSON.stringify({
          qr_token: attendanceToken,
          browser_id: browserId,
        }),
      });
      notice.textContent = "Attendance marked successfully.";
      notice.className = "success";
      button.textContent = "Present";
    } catch (error) {
      notice.textContent = error.message;
      notice.className = "error";
      button.disabled = false;
    }
  };
}

if (attendanceToken) attendance();
else registration();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => {}),
  );
