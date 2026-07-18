import QRCode from "qrcode";
import { api, auth, esc, msg } from "../core/api.js";
import { buildStudentUrl } from "../core/student-links.js";
import { shell } from "./layout.js";
import { confirmDialog } from "../ui.js";

export async function studentDetailPage() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const studentId = params.get("student");
  const now = new Date();
  const month =
    params.get("month") ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  shell(
    "students",
    "Student record",
    `<a class="back-link" href="#students">← Back to students</a><section id="student-detail" class="student-detail-page">Loading student record...</section>`,
  );
  const host = document.querySelector("#student-detail");
  try {
    const summary = await api(
      `/api/students/${studentId}/monthly-summary?month=${encodeURIComponent(month)}`,
    );
    render(summary);
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }

  function render(summary) {
    const student = summary.student;
    host.innerHTML = `<header class="student-record-head"><div><span class="status-pill">${esc(student.student_code)}</span><h2>${esc(student.full_name)}</h2><p>${esc(student.grade)} · <span data-browser-status>${esc(student.browser_status)}</span></p></div><div class="card-actions"><button class="icon-action" data-edit aria-label="Edit student" data-tooltip="Edit student"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"/></svg></button><button class="icon-action" data-reset aria-label="Reset browser" data-tooltip="Reset browser"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8m16 8-2.2 1.8A7 7 0 0 1 5.5 15"/></svg></button><button class="icon-action danger" data-archive aria-label="Archive student" data-tooltip="Archive student"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 11v6M15 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div></header><section class="student-contact-grid"><div><small>Student phone</small><strong>${esc(student.student_phone)}</strong></div><div><small>Guardian</small><strong>${esc(student.guardian_name)}</strong></div><div><small>Guardian WhatsApp</small><strong>${esc(student.guardian_whatsapp)}</strong></div></section><section class="qr-session-stage" data-browser-connect hidden></section><div class="attendance-month-control"><label>Attendance month<input id="student-month" type="month" value="${month}"></label></div><section class="student-insight-grid attendance-only"><article><p class="kicker">Monthly attendance</p><div class="attendance-totals"><span><strong>${summary.present}</strong>Present</span><span><strong>${summary.absent}</strong>Absent</span><span><strong>${summary.attendance_rate}%</strong>Rate</span></div><details><summary>View class and date breakdown</summary>${summary.attendance.map((record) => `<div class="detail-line"><span>${esc(record.class_name)}<small>${esc(record.attendance_date)}</small></span><strong class="attendance-${record.status.toLowerCase()}">${esc(record.status)}</strong></div>`).join("") || '<p class="muted">No attendance records for this month.</p>'}</details></article></section><dialog id="edit-student-dialog" class="management-dialog"><div class="dialog-heading"><h3>Edit student</h3><button class="icon-button" data-close-edit aria-label="Close">&times;</button></div><form id="detail-student-form" class="grid-form"><label>Full name<input name="full_name" value="${esc(student.full_name)}" required></label><label>Student phone<input name="student_phone" value="${esc(student.student_phone)}" required></label><label>Guardian name<input name="guardian_name" value="${esc(student.guardian_name)}" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" value="${esc(student.guardian_whatsapp)}" required></label><label>Grade<select name="grade"><option ${student.grade === "Grade 10" ? "selected" : ""}>Grade 10</option><option ${student.grade === "Grade 11" ? "selected" : ""}>Grade 11</option></select></label><button class="button">Save changes</button></form></dialog>`;
    document.querySelector("#student-month").onchange = (event) => {
      location.hash = `#student?student=${studentId}&month=${event.target.value}`;
    };
    host.querySelector("[data-reset]").onclick = async (event) => {
      if (
        !(await confirmDialog({
          title: "Replace approved browser?",
          message:
            "The current browser will stop working for attendance until a new browser is approved.",
          confirmLabel: "Reset browser",
          danger: true,
        }))
      )
        return;

      const button = event.currentTarget;
      const connectionPanel = host.querySelector("[data-browser-connect]");
      button.disabled = true;
      try {
        await api(`/api/students/${studentId}/reset-browser`, {
          method: "POST",
        });
        const tutorId = auth()?.user?.id;
        if (!tutorId)
          throw Error("Your tutor session is missing. Log in again.");
        const connectionUrl = buildStudentUrl(location.origin, {
          connect: "true",
          tutor: tutorId,
        });
        const qr = await QRCode.toDataURL(connectionUrl, { width: 300 });
        host.querySelector("[data-browser-status]").textContent =
          "Awaiting replacement";
        connectionPanel.hidden = false;
        connectionPanel.innerHTML = `<div class="qr-focus"><span class="status-pill">Browser reset</span><h3>Connect the student's new browser</h3><img src="${qr}" alt="Browser connection QR for ${esc(student.full_name)}"><p>Ask the student to scan this QR using the replacement phone or browser.</p><button type="button" class="button secondary" data-copy-connection>Copy connection link</button><p class="muted" data-copy-notice></p></div>`;
        connectionPanel.querySelector("[data-copy-connection]").onclick =
          async () => {
            const notice = connectionPanel.querySelector("[data-copy-notice]");
            try {
              await navigator.clipboard.writeText(connectionUrl);
              notice.textContent = "Connection link copied.";
            } catch {
              notice.textContent = connectionUrl;
            }
          };
      } catch (error) {
        connectionPanel.hidden = false;
        connectionPanel.innerHTML = msg(error.message, "error");
        button.disabled = false;
      }
    };
    host.querySelector("[data-archive]").onclick = async (event) => {
      if (
        !(await confirmDialog({
          title: "Archive this student?",
          message:
            "Historical attendance and fee records will remain available.",
          confirmLabel: "Archive student",
          danger: true,
        }))
      )
        return;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await api(`/api/students/${studentId}`, { method: "DELETE" });
        location.hash = "#students";
      } catch (error) {
        button.disabled = false;
        host.insertAdjacentHTML("afterbegin", msg(error.message, "error"));
      }
    };
    const dialog = document.querySelector("#edit-student-dialog");
    host.querySelector("[data-edit]").onclick = () => dialog.showModal();
    host.querySelector("[data-close-edit]").onclick = () => dialog.close();
    document.querySelector("#detail-student-form").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector(
        'button[type="submit"], button:not([type])',
      );
      button.disabled = true;
      try {
        await api(`/api/students/${studentId}`, {
          method: "PUT",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        dialog.close();
        studentDetailPage();
      } catch (error) {
        button.disabled = false;
        form.insertAdjacentHTML("afterbegin", msg(error.message, "error"));
      }
    };
  }
}
