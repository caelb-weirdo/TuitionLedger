import "./style.css";
import "./logo.css";
import { api } from "./core/api.js";

const app = document.querySelector("#app");
const browserId =
  localStorage.getItem("tuitionledger-browser") || crypto.randomUUID();
localStorage.setItem("tuitionledger-browser", browserId);
const params = new URLSearchParams(location.search);
const token = params.get("registration_token");
const attendanceToken = params.get("attendance_token");
const subjects = ["Maths", "Science", "English", "Tamil", "History"];
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
      showRegistrationResult("success", request.id);
      window.setTimeout(() => {
        renderApprovalStatus(request.id);
        const poll = window.setInterval(async () => {
          try {
            const state = await api(
              `/api/registration-requests/${request.id}/status?browser_id=${encodeURIComponent(browserId)}`,
            );
            if (state.status === "Approved") {
              window.clearInterval(poll);
              showApprovalResult(state.student_code);
            } else if (state.status === "Rejected") {
              window.clearInterval(poll);
              showRejectedResult();
            }
          } catch (_) {
            // Keep the waiting state during short network interruptions.
          }
        }, 3000);
      }, 1400);
    } catch (error) {
      showRegistrationResult("error", null, error.message);
    }
  };
}

function showRegistrationResult(kind, requestId, errorMessage = "") {
  const success = kind === "success";
  app.innerHTML = `<main class="student-card status-screen"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><div class="result-icon ${success ? "success" : "rejected"}">${success ? "✓" : "!"}</div><p class="eyebrow">${success ? "REQUEST RECEIVED" : "REQUEST NOT SENT"}</p><h1>${success ? "Your details are on the way." : "We could not send your request."}</h1><p class="intro">${success ? "Your tutor can now review your registration. Preparing your approval tracker…" : errorMessage}</p>${success ? '<div class="color-loader" aria-label="Preparing approval tracker"></div><p class="status-note">Request reference: ' + String(requestId).slice(0, 8) + "</p>" : '<button class="primary" id="retry-registration">Try again</button>'}</main>`;
  if (!success)
    document.querySelector("#retry-registration").onclick = registration;
}

function renderApprovalStatus(requestId) {
  app.innerHTML = `<main class="student-card status-screen"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><p class="eyebrow">REGISTRATION IN PROGRESS</p><div class="color-loader" aria-label="Checking approval status"></div><h1>You're all set.</h1><p class="intro">Your details are with your tutor. Keep this page open — we’ll update it automatically.</p><section class="status-steps" aria-label="Registration progress"><div class="status-step complete"><span>✓</span><div><strong>Details sent</strong><small>Your registration is safely received.</small></div></div><div class="status-step active"><span>2</span><div><strong>Tutor review</strong><small>Waiting for your tutor to approve this browser.</small></div></div><div class="status-step"><span>3</span><div><strong>Ready for attendance</strong><small>Your student ID appears here after approval.</small></div></div></section><p class="status-note">Request reference: ${String(requestId).slice(0, 8)}</p></main>`;
}

function showApprovalResult(studentCode) {
  app.insertAdjacentHTML(
    "beforeend",
    `<div class="success-popup" role="status" aria-live="polite"><div class="success-icon">✓</div><p class="eyebrow">APPROVAL COMPLETE</p><h2>You're ready to learn.</h2><p>Your browser is approved for attendance.</p><strong class="student-code">${studentCode || "Student ID ready"}</strong><button class="primary" id="approval-done">Continue</button></div>`,
  );
  document.querySelector(".status-step.active")?.classList.remove("active");
  document.querySelectorAll(".status-step")[2]?.classList.add("complete");
  document
    .querySelectorAll(".status-step")[2]
    ?.querySelector("small")
    .replaceChildren("You can now scan a class QR.");
  document.querySelector("#approval-done").onclick = () =>
    document.querySelector(".success-popup")?.remove();
}

function showRejectedResult() {
  app.innerHTML = `<main class="student-card status-screen"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><p class="eyebrow">REGISTRATION UPDATE</p><div class="result-icon rejected">!</div><h1>Not approved yet.</h1><p class="intro">Your tutor could not approve this registration. Please contact them for the next step.</p></main>`;
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
