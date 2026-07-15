import { api, esc, msg } from "../core/api.js";
import { shell } from "./layout.js";

export async function attendanceWorkspacePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><p class="kicker">Attendance history</p><h2>Review the register and correct a status.</h2><p class="muted">Live QR sessions now start from Classes. This page is the permanent attendance record.</p></section><article class="form-card"><form id="attendance-filter" class="grid-form"><label>Class<select id="attendance-class" required disabled><option value="">Loading classes…</option></select></label><label>Date<input id="attendance-date" type="date"></label><button class="button button-ghost" type="button" id="clear-attendance-date">All dates</button></form><p id="attendance-notice" class="form-notice" aria-live="polite"></p></article><section class="panel attendance-history"><div class="section-heading"><p class="kicker">Register</p><h3 id="attendance-title">Select a class</h3></div><div id="attendance-list"><p class="muted">Loading your classes…</p></div></section>`,
  );

  const classSelect = document.querySelector("#attendance-class");
  const dateInput = document.querySelector("#attendance-date");
  const listHost = document.querySelector("#attendance-list");
  const notice = document.querySelector("#attendance-notice");
  let records = [];

  const render = () => {
    const visible = dateInput.value
      ? records.filter((record) => record.attendance_date === dateInput.value)
      : records;
    document.querySelector("#attendance-title").textContent =
      `${visible.length} record${visible.length === 1 ? "" : "s"}${dateInput.value ? ` on ${dateInput.value}` : ""}`;
    listHost.innerHTML =
      visible
        .map(
          (record) => `<article class="attendance-history-row"><div><strong>${esc(record.full_name)}</strong><small>${esc(record.student_code)} · ${esc(record.attendance_date)} · ${esc(record.marked_method)}</small></div><span class="attendance-status ${record.status.toLowerCase()}">${esc(record.status)}</span><div class="attendance-actions"><button class="button button-small ${record.status === "Present" ? "button-ghost" : ""}" data-status="Present" data-record="${record.id}">Present</button><button class="button button-small ${record.status === "Absent" ? "button-ghost" : ""}" data-status="Absent" data-record="${record.id}">Absent</button></div></article>`,
        )
        .join("") ||
      `<p class="muted">No attendance records match these filters. Start the next QR from Classes.</p>`;
    listHost.querySelectorAll("[data-record]").forEach((button) => {
      button.onclick = async () => {
        const record = records.find((item) => item.id === button.dataset.record);
        try {
          await api("/api/attendance/manual", {
            method: "POST",
            body: JSON.stringify({
              session_id: record.session_id,
              class_id: record.class_id,
              student_id: record.student_id,
              status: button.dataset.status,
            }),
          });
          await loadRecords();
          notice.textContent = `${record.full_name} marked ${button.dataset.status.toLowerCase()}.`;
          notice.className = "form-notice success";
        } catch (error) {
          notice.textContent = error.message;
          notice.className = "form-notice error";
        }
      };
    });
  };

  const loadRecords = async () => {
    if (!classSelect.value) return;
    listHost.innerHTML = '<p class="muted">Loading attendance…</p>';
    try {
      records = await api(`/api/attendance/classes/${classSelect.value}`);
      render();
    } catch (error) {
      listHost.innerHTML = msg(error.message, "error");
    }
  };

  dateInput.onchange = render;
  document.querySelector("#clear-attendance-date").onclick = () => {
    dateInput.value = "";
    render();
  };
  classSelect.onchange = loadRecords;

  try {
    const classes = await api("/api/classes");
    classSelect.innerHTML = classes.length
      ? classes.map((item) => `<option value="${item.id}">${esc(item.grade)} · ${esc(item.subject)} · ${esc(item.class_name)}</option>`).join("")
      : '<option value="">No classes available</option>';
    classSelect.disabled = !classes.length;
    notice.textContent = classes.length
      ? "Filter by class and date. Corrections are saved as manual updates."
      : "Create a class first.";
    if (classes.length) await loadRecords();
    else render();
  } catch (error) {
    classSelect.innerHTML = '<option value="">Unable to load classes</option>';
    notice.textContent = error.message;
    notice.className = "form-notice error";
    listHost.innerHTML = msg(error.message, "error");
  }
}
