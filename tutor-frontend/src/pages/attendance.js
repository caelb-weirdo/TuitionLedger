import QRCode from 'qrcode';
import { api, esc, msg } from '../core/api.js';
import { studentUrl } from '../core/config.js';
import { shell } from './layout.js';
async function attendancePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><p class="kicker">Live attendance</p><h2>Open a short-lived room QR.</h2></section><article class="form-card"><form id="attendance-form" class="grid-form"><label>Class<select name="class_id" id="attendance-class"></select></label><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button">Open attendance QR</button></form></article><section id="attendance-result" class="panel">Select a class to begin.</section>`,
  );
  try {
    const list = await api("/api/classes");
    document.querySelector("#attendance-class").innerHTML = list
      .map(
        (x) =>
          `<option value="${x.id}">${esc(x.grade)} · ${esc(x.subject)} · ${esc(x.class_name)}</option>`,
      )
      .join("");
  } catch (e) {
    document.querySelector("#attendance-result").innerHTML = msg(
      e.message,
      "error",
    );
  }
  document.querySelector("#attendance-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const x = await api("/api/attendance-sessions", {
          method: "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        }),
        url = `${studentUrl}/?attendance_token=${encodeURIComponent(x.qr_token)}`,
        qr = await QRCode.toDataURL(url, { width: 260 });
      document.querySelector("#attendance-result").innerHTML =
        `<div class="qr-card"><span class="status-pill">Active for ${x.duration_minutes} minutes</span><h3>Show this QR to enrolled students</h3><img src="${qr}" alt="Attendance QR"><p>${esc(url)}</p><button id="end-session" class="button">End session</button></div>`;
      document.querySelector("#end-session").onclick = async () => {
        await api(`/api/attendance-sessions/${x.id}/end`, { method: "POST" });
        document.querySelector("#attendance-result").innerHTML = msg(
          "Attendance session ended.",
          "success",
        );
      };
    } catch (x) {
      document.querySelector("#attendance-result").innerHTML = msg(
        x.message,
        "error",
      );
    }
  };
}
export async function attendanceWorkspacePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><p class="kicker">Attendance register</p><h2>Choose a class, then record the room.</h2><p class="muted">Use the QR for normal student scanning, or mark a student manually when their phone cannot scan.</p></section><article class="form-card"><form id="attendance-form" class="grid-form"><label>Class<select name="class_id" id="attendance-class" required disabled><option value="">Loading classes…</option></select></label><label>Date<input type="date" name="attendance_date" id="attendance-date" required></label><label>QR duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button" disabled>Loading classes…</button></form><p id="attendance-notice" class="form-notice" aria-live="polite"></p></article><section class="attendance-layout"><article class="panel"><div class="section-heading"><p class="kicker">Enrolled students</p><h3 id="roster-title">Select a class</h3></div><div id="attendance-roster" class="attendance-roster"><p class="muted">Loading your classes…</p></div></article><article id="attendance-result" class="panel"><p class="muted">The QR will appear here after you generate a session.</p></article></section>`,
  );
  const dateInput = document.querySelector("#attendance-date");
  const classSelect = document.querySelector("#attendance-class");
  const attendanceForm = document.querySelector("#attendance-form");
  const attendanceNotice = document.querySelector("#attendance-notice");
  dateInput.value = new Date().toISOString().slice(0, 10);
  let currentSession = null;
  let enrolled = [];
  let records = [];
  const roster = document.querySelector("#attendance-roster");
  const statusFor = (studentId) =>
    records.find((x) => x.student_id === studentId)?.status || "Not marked";
  const renderRoster = () => {
    document.querySelector("#roster-title").textContent =
      `${enrolled.length} enrolled student${enrolled.length === 1 ? "" : "s"}`;
    roster.innerHTML =
      enrolled
        .map(
          (s) =>
            `<div class="attendance-row"><div><strong>${esc(s.full_name)}</strong><small>${esc(s.student_code)} · ${esc(s.student_phone)}</small></div><span class="attendance-status ${statusFor(s.id).toLowerCase().replace(" ", "-")}">${esc(statusFor(s.id))}</span><div class="attendance-actions"><button class="button button-small" data-manual="Present" data-student="${s.id}" ${currentSession ? "" : "disabled"}>Present</button><button class="button button-small button-ghost" data-manual="Absent" data-student="${s.id}" ${currentSession ? "" : "disabled"}>Absent</button></div></div>`,
        )
        .join("") ||
      `<p class="muted">No students are enrolled in this class yet.</p>`;
    roster.querySelectorAll("[data-manual]").forEach(
      (button) =>
        (button.onclick = async () => {
          try {
            await api("/api/attendance/manual", {
              method: "POST",
              body: JSON.stringify({
                session_id: currentSession.id,
                class_id: currentSession.class_id,
                student_id: button.dataset.student,
                status: button.dataset.manual,
              }),
            });
            await loadRecords();
          } catch (error) {
            roster.insertAdjacentHTML(
              "afterbegin",
              msg(error.message, "error"),
            );
          }
        }),
    );
  };
  const loadRecords = async () => {
    if (!document.querySelector("#attendance-class").value) return;
    records = await api(
      `/api/attendance/classes/${document.querySelector("#attendance-class").value}`,
    );
    records = records.filter((x) => x.attendance_date === dateInput.value);
    renderRoster();
  };
  try {
    const list = await api("/api/classes");
    if (!Array.isArray(list)) throw Error("Classes could not be loaded. Refresh and try again.");
    classSelect.innerHTML = list.length
      ? list
      .map(
        (x) =>
          `<option value="${x.id}">${esc(x.grade)} · ${esc(x.subject)} · ${esc(x.class_name)}</option>`,
      )
      .join("")
      : '<option value="">No classes available</option>';
    classSelect.disabled = !list.length;
    attendanceForm.querySelector("button").disabled = !list.length;
    attendanceForm.querySelector("button").textContent = "Generate attendance QR";
    attendanceNotice.textContent = list.length
      ? `${list.length} class${list.length === 1 ? "" : "es"} loaded.`
      : "Create a class first, then return here to open attendance.";
    const loadRoster = async () => {
      const classId = document.querySelector("#attendance-class").value;
      if (!classId) return;
      currentSession = null;
      document.querySelector("#attendance-result").innerHTML =
        '<p class="muted">Generate a session to enable manual attendance.</p>';
      enrolled = await api(`/api/classes/${classId}/students`);
      records = [];
      try {
        await loadRecords();
      } catch {}
      renderRoster();
    };
    document.querySelector("#attendance-class").onchange = loadRoster;
    dateInput.onchange = async () => {
      currentSession = null;
      document.querySelector("#attendance-result").innerHTML =
        '<p class="muted">Generate a session for this date to enable manual attendance.</p>';
      await loadRecords();
    };
    await loadRoster();
  } catch (error) {
    classSelect.innerHTML = '<option value="">Unable to load classes</option>';
    classSelect.disabled = true;
    attendanceForm.querySelector("button").disabled = true;
    attendanceNotice.textContent = error.message;
    attendanceNotice.className = "form-notice error";
    roster.innerHTML = msg(error.message, "error");
  }
  document.querySelector("#attendance-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const session = await api("/api/attendance-sessions", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      currentSession = session;
      const url = `${studentUrl}/?attendance_token=${encodeURIComponent(session.qr_token)}`,
        qr = await QRCode.toDataURL(url, { width: 260 });
      document.querySelector("#attendance-result").innerHTML =
        `<div class="qr-card"><span class="status-pill">${esc(session.attendance_date)} · Active for ${session.duration_minutes} minutes</span><h3>Show this QR to enrolled students</h3><img src="${qr}" alt="Attendance QR code"><p class="muted">Students scan this from their approved browser. You can use the manual buttons beside any enrolled student.</p><button id="end-session" class="button">End session</button></div>`;
      renderRoster();
      document.querySelector("#end-session").onclick = async () => {
        await api(`/api/attendance-sessions/${session.id}/end`, {
          method: "POST",
        });
        currentSession = null;
        document.querySelector("#attendance-result").innerHTML = msg(
          "Attendance session ended.",
          "success",
        );
        renderRoster();
      };
    } catch (error) {
      document.querySelector("#attendance-result").innerHTML = msg(
        error.message,
        "error",
      );
    }
  };
}
