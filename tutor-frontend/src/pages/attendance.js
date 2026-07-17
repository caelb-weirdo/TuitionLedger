import { api, esc, msg } from "../core/api.js";
import {
  attendanceSummary,
  filterAttendance,
  formatDate,
  skeletonRows,
} from "../ui.js";
import { shell } from "./layout.js";

export async function attendanceWorkspacePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><div><p class="kicker">Permanent register</p><h2>Review and correct attendance.</h2><p class="muted">Choose a class, date, or status. Live sessions start from Classes.</p></div></section><section class="filter-bar"><label>Class<select id="attendance-class" disabled><option>Loading classes…</option></select></label><label>Date<input id="attendance-date" type="date"></label><label>Status<select id="attendance-status"><option value="">All statuses</option><option>Present</option><option>Absent</option></select></label><button class="button button-ghost" id="clear-attendance" type="button">Clear filters</button></section><p id="attendance-notice" class="form-notice" role="status" aria-live="polite"></p><section id="attendance-summary" class="summary-strip" aria-label="Attendance summary"></section><section class="panel attendance-history"><div class="section-heading"><p class="kicker">Register</p><h3 id="attendance-title">Select a class</h3></div><div id="attendance-list">${skeletonRows()}</div></section><dialog id="correction-dialog" class="management-dialog"><form id="correction-form"><div class="dialog-heading"><div><p class="kicker">Manual correction</p><h3 id="correction-student"></h3></div><button class="icon-button" type="button" data-close aria-label="Close">×</button></div><p id="correction-change" class="muted"></p><label>Reason<select name="reason-choice" required><option value="">Choose a reason</option><option>QR scanning problem</option><option>Tutor confirmed attendance</option><option>Student arrived late</option><option>Incorrect record</option><option>Other</option></select></label><label data-other hidden>Other reason<textarea name="other-reason" maxlength="300"></textarea></label><div class="dialog-actions"><button type="button" class="button button-ghost" data-close>Cancel</button><button class="button">Save correction</button></div></form></dialog>`,
  );
  const classSelect = document.querySelector("#attendance-class");
  const dateInput = document.querySelector("#attendance-date");
  const statusSelect = document.querySelector("#attendance-status");
  const listHost = document.querySelector("#attendance-list");
  const notice = document.querySelector("#attendance-notice");
  const dialog = document.querySelector("#correction-dialog");
  let records = [];
  let pending = null;

  function render() {
    const visible = filterAttendance(
      records,
      dateInput.value,
      statusSelect.value,
    );
    const totals = attendanceSummary(visible);
    document.querySelector("#attendance-summary").innerHTML =
      `<article><span>Expected</span><strong>${totals.expected}</strong></article><article><span>Present</span><strong>${totals.present}</strong></article><article><span>Absent</span><strong>${totals.absent}</strong></article><article><span>Attendance</span><strong>${totals.percentage}%</strong></article>`;
    document.querySelector("#attendance-title").textContent = dateInput.value
      ? `${visible.length} records · ${formatDate(dateInput.value)}`
      : `${visible.length} records`;
    listHost.innerHTML = visible.length
      ? `<div class="attendance-directory"><div class="attendance-directory-head"><span>Student</span><span>Date and method</span><span>Status</span><span></span></div>${visible
          .map(
            (record) =>
              `<article class="attendance-directory-row record-card"><span class="attendance-student"><strong>${esc(record.full_name)}</strong><small>${esc(record.student_code)}</small></span><span class="attendance-meta">${formatDate(record.attendance_date)}<small>${esc(record.marked_method)}</small></span><span class="attendance-status ${record.status.toLowerCase()}">${record.status === "Present" ? "✓" : "×"} ${esc(record.status)}</span><button class="button button-small button-ghost" data-record="${record.id}">Change</button></article>`,
          )
          .join("")}</div>`
      : '<div class="empty-state"><h3>No attendance records</h3><p>Try clearing the filters or start attendance from Classes.</p></div>';
    listHost.querySelectorAll("[data-record]").forEach(
      (button) =>
        (button.onclick = () => {
          const record = records.find(
            (item) => item.id === button.dataset.record,
          );
          pending = {
            record,
            status: record.status === "Present" ? "Absent" : "Present",
          };
          document.querySelector("#correction-student").textContent =
            record.full_name;
          document.querySelector("#correction-change").textContent =
            `${record.status} → ${pending.status}`;
          dialog.showModal();
        }),
    );
  }

  async function loadRecords() {
    if (!classSelect.value) return;
    listHost.innerHTML = skeletonRows();
    try {
      records = await api(`/api/attendance/classes/${classSelect.value}`, {
        force: true,
      });
      render();
    } catch (error) {
      listHost.innerHTML = `${msg(error.message, "error")}<button class="button" id="retry-attendance">Retry</button>`;
      document.querySelector("#retry-attendance").onclick = loadRecords;
    }
  }

  document
    .querySelectorAll("[data-close]")
    .forEach((button) => (button.onclick = () => dialog.close()));
  const reasonChoice = document.querySelector('[name="reason-choice"]');
  reasonChoice.onchange = () => {
    document.querySelector("[data-other]").hidden =
      reasonChoice.value !== "Other";
  };
  document.querySelector("#correction-form").onsubmit = async (event) => {
    event.preventDefault();
    const other = event.currentTarget.elements["other-reason"].value.trim();
    const reason = reasonChoice.value === "Other" ? other : reasonChoice.value;
    if (!reason || reason.length < 3) {
      notice.textContent = "Enter a reason of at least 3 characters.";
      notice.className = "form-notice error";
      return;
    }
    const submit = event.submitter;
    submit.disabled = true;
    try {
      await api("/api/attendance/manual", {
        method: "POST",
        body: JSON.stringify({
          session_id: pending.record.session_id,
          class_id: pending.record.class_id,
          student_id: pending.record.student_id,
          status: pending.status,
          reason,
        }),
      });
      dialog.close();
      event.currentTarget.reset();
      await loadRecords();
      notice.textContent = `${pending.record.full_name} marked ${pending.status.toLowerCase()}.`;
      notice.className = "form-notice success";
    } catch (error) {
      notice.textContent = error.message;
      notice.className = "form-notice error";
    } finally {
      submit.disabled = false;
    }
  };
  [dateInput, statusSelect].forEach((control) => (control.onchange = render));
  document.querySelector("#clear-attendance").onclick = () => {
    dateInput.value = "";
    statusSelect.value = "";
    render();
  };
  classSelect.onchange = loadRecords;
  try {
    const classes = await api("/api/classes");
    classSelect.innerHTML = classes.length
      ? classes
          .map(
            (item) =>
              `<option value="${item.id}">${esc(item.grade)} · ${esc(item.class_name)}</option>`,
          )
          .join("")
      : '<option value="">No classes available</option>';
    classSelect.disabled = !classes.length;
    if (classes.length) await loadRecords();
    else render();
  } catch (error) {
    classSelect.innerHTML = "<option>Unable to load classes</option>";
    listHost.innerHTML = msg(error.message, "error");
  }
}
