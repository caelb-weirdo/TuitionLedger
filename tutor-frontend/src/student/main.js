import "./student.css";
import { publicApi as api } from "../core/public-api.js";
import { approvalPollDelay } from "./polling.js";

let app;
let registrationToken;
let attendanceToken;
let connectMode;
let tutorId;
let browserId;
let pollTimer = null;
let pollInProgress = false;

function shell(eyebrow, title, body) {
  app.innerHTML = `<main class="student-card"><div class="brand"><img src="/icon.svg" alt="TuitionLedger logo"><small>TuitionLedger Student</small></div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${body}</main>`;
}

function stopPolling() {
  if (pollTimer) window.clearTimeout(pollTimer);
  pollTimer = null;
}

function rememberRequest(kind, id) {
  localStorage.setItem(
    "tuitionledger:pending",
    JSON.stringify({ kind, id, browserId }),
  );
}

function clearRememberedRequest() {
  localStorage.removeItem("tuitionledger:pending");
}

function rememberedRequest() {
  try {
    return JSON.parse(localStorage.getItem("tuitionledger:pending") || "null");
  } catch {
    clearRememberedRequest();
    return null;
  }
}

function waiting(kind, requestId) {
  stopPolling();
  const pollingStartedAt = Date.now();
  shell(
    "REQUEST RECEIVED",
    "Your details are with your tutor.",
    `<p class="intro">Registration submitted successfully. Your tutor can now approve this request from the Students page.</p><section class="status-steps"><div class="status-step complete"><span>✓</span><div><strong>Details received</strong><small>Your request is safely stored.</small></div></div><div class="status-step active"><span>2</span><div><strong>Tutor review</strong><small>Waiting for approval.</small></div></div><div class="status-step"><span>3</span><div><strong>Ready for attendance</strong><small>Your Student ID appears after approval.</small></div></div></section><p class="status-note">Request reference: ${String(requestId).slice(0, 8)}</p><button type="button" class="primary" id="check-approval">Check Approval Now</button><p id="polling-note" class="status-note" role="status"></p>`,
  );

  const checkButton = document.querySelector("#check-approval");
  const pollingNote = document.querySelector("#polling-note");

  const scheduleNextPoll = () => {
    const elapsed = Date.now() - pollingStartedAt;
    const delay = document.hidden
      ? Math.max(30_000, approvalPollDelay(elapsed))
      : approvalPollDelay(elapsed);
    pollTimer = window.setTimeout(poll, delay);
  };

  const poll = async () => {
    if (pollInProgress) return;
    pollInProgress = true;
    checkButton.disabled = true;
    checkButton.textContent = "Checking approval...";
    pollingNote.textContent = "";
    try {
      const path =
        kind === "registration"
          ? `/api/registration-requests/${requestId}/status?browser_id=${encodeURIComponent(browserId)}`
          : `/api/browser-requests/${requestId}/status?browser_id=${encodeURIComponent(browserId)}`;
      const state = await api(path);
      if (state.status === "Approved") {
        stopPolling();
        clearRememberedRequest();
        result(
          "APPROVED",
          "Browser approved.",
          `Your Student ID is <strong class="student-code">${state.student_code}</strong>.<br>You can now scan your class attendance QR.`,
        );
        return;
      }
      if (state.status === "Rejected") {
        stopPolling();
        clearRememberedRequest();
        result(
          "NOT APPROVED",
          "Registration was not approved.",
          "Please contact your tutor for the next step.",
          "rejected",
        );
        return;
      }
      pollingNote.textContent = "Still waiting for tutor approval.";
    } catch {
      pollingNote.textContent =
        "The approval check could not connect. Your request is still saved.";
    } finally {
      pollInProgress = false;
      if (document.body.contains(checkButton)) {
        checkButton.disabled = false;
        checkButton.textContent = "Check Approval Now";
        scheduleNextPoll();
      }
    }
  };

  checkButton.addEventListener("click", () => {
    stopPolling();
    poll();
  });
  poll();
}

function result(eyebrow, title, message, kind = "success", retry) {
  shell(
    eyebrow,
    title,
    `<div class="result-icon ${kind}">${kind === "success" ? "✓" : "!"}</div><p class="intro">${message}</p>${retry ? '<button class="primary" id="retry">Try Again</button>' : '<button class="primary" id="done">Done</button>'}`,
  );
  document.querySelector("#retry")?.addEventListener("click", retry);
  document.querySelector("#done")?.addEventListener("click", () => {
    location.href = `${location.origin}/`;
  });
}

function registration() {
  shell(
    "STUDENT REGISTRATION",
    "Student registration",
    `<p class="intro">Enter the student and guardian details used for class records. Your tutor must approve the request before attendance is enabled.</p><form id="registration"><label>Student full name<input name="full_name" autocomplete="name" minlength="2" maxlength="160" required placeholder="A. Kavindu Perera"><small>Use the name shown on school or class records.</small></label><label>Student mobile number<input name="student_phone" inputmode="tel" maxlength="12" required placeholder="+94771234567"><small>Sri Lankan mobile number in +94 format.</small></label><label>Parent or guardian name<input name="guardian_name" minlength="2" maxlength="160" required placeholder="S. Perera"></label><label>Guardian WhatsApp number<input name="guardian_whatsapp" inputmode="tel" maxlength="12" required placeholder="+94771234567"><small>Used only for tutor-initiated fee reminders.</small></label><label>Current grade<select name="grade" required><option value="">Choose grade</option><option>Grade 10</option><option>Grade 11</option></select></label><div id="notice" role="status" aria-live="polite"></div><button class="primary">Submit registration</button></form>`,
  );
  const form = document.querySelector("#registration");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const notice = document.querySelector("#notice");
    button.disabled = true;
    button.textContent = "Submitting registration...";
    notice.className = "submission-status loading";
    notice.innerHTML =
      '<span class="mini-spinner" aria-hidden="true"></span><strong>Submitting your registration</strong><small>Please keep this page open.</small>';
    const values = Object.fromEntries(new FormData(form));
    try {
      const request = await api("/api/register-student", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          registration_token: registrationToken,
          browser_id: browserId,
        }),
      });
      rememberRequest("registration", request.id);
      waiting("registration", request.id);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Try submitting again";
      notice.textContent = `Registration was not submitted: ${error.message}`;
      notice.className = "submission-status error";
    }
  };
}

function connectBrowser() {
  shell(
    "BROWSER CONNECTION",
    "Connect this browser.",
    `<p class="intro">Enter the Student ID provided by your tutor.</p><form id="connect"><label>Student ID<input name="student_code" required maxlength="9" pattern="STU[0-9]{3,6}" placeholder="e.g., STU001" autocomplete="off"></label><p id="notice" role="status"></p><button class="primary">Request connection</button></form>`,
  );
  const form = document.querySelector("#connect");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Sending request...";
    try {
      const request = await api("/api/browser-requests", {
        method: "POST",
        body: JSON.stringify({
          student_code: form.student_code.value.trim().toUpperCase(),
          browser_id: browserId,
          tutor_id: tutorId,
        }),
      });
      rememberRequest("browser", request.id);
      waiting("browser", request.id);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Request connection";
      document.querySelector("#notice").textContent = error.message;
      document.querySelector("#notice").className = "error";
    }
  };
}

async function attendance() {
  shell(
    "ATTENDANCE",
    "Checking attendance...",
    '<div class="color-loader" aria-label="Checking attendance"></div><p class="intro">This approved browser is being checked against the class session.</p>',
  );
  try {
    const data = await api("/api/attendance/scan", {
      method: "POST",
      body: JSON.stringify({
        qr_token: attendanceToken,
        browser_id: browserId,
      }),
    });
    if (data.result === "Already Marked") {
      result(
        "ATTENDANCE",
        "Your attendance was already recorded.",
        "No second record was created.",
      );
    } else {
      result(
        "ATTENDANCE",
        "Attendance marked Present.",
        "Your attendance was saved successfully.",
      );
    }
  } catch (error) {
    const titles = {
      410:
        error.data?.result === "Ended"
          ? "This attendance session has ended."
          : "This QR session has expired.",
      403:
        error.data?.result === "Not Enrolled"
          ? "You are not enrolled in this class."
          : "This browser is not approved for attendance.",
    };
    result(
      "ATTENDANCE",
      titles[error.status] || "We could not check your attendance.",
      error.message,
      "rejected",
      error.status ? null : attendance,
    );
  }
}

export function startStudentApp() {
  document.body.classList.add("student-view");
  document.title = "TuitionLedger Student";
  app = document.querySelector("#app");
  const params = new URLSearchParams(location.search);
  registrationToken = params.get("registration_token");
  attendanceToken = params.get("attendance_token");
  connectMode = params.get("connect") === "true";
  tutorId = params.get("tutor");
  browserId =
    localStorage.getItem("tuitionledger-browser") || crypto.randomUUID();
  localStorage.setItem("tuitionledger-browser", browserId);

  const remembered = rememberedRequest();
  if (attendanceToken) attendance();
  else if (remembered?.browserId === browserId) {
    waiting(remembered.kind, remembered.id);
  } else if (registrationToken) registration();
  else if (connectMode && tutorId) connectBrowser();
  else {
    shell(
      "TUITIONLEDGER STUDENT",
      "Open a valid tutor link.",
      '<p class="intro">Scan a Registration QR, Attendance QR, or use the browser-connection link provided by your tutor.</p>',
    );
  }

  window.addEventListener("beforeunload", stopPolling, { once: true });
}
