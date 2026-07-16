import { api, esc, msg } from "../core/api.js";
import { shell } from "./layout.js";

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
    await api("/api/fees/ensure", {
      method: "POST",
      body: JSON.stringify({ month }),
    });
    const summary = await api(
      `/api/students/${studentId}/monthly-summary?month=${encodeURIComponent(month)}`,
    );
    render(summary);
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }

  function render(summary) {
    const student = summary.student;
    const hasFees = summary.fees.length > 0;
    const unpaid = hasFees && summary.payment_status === "Unpaid";
    const selectedDate = new Date(`${month}-01T00:00:00`);
    const today = new Date();
    const lastDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
    ).getDate();
    const urgent =
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() > lastDay - 5;
    host.innerHTML = `<header class="student-record-head"><div><span class="status-pill">${esc(student.student_code)}</span><h2>${esc(student.full_name)}</h2><p>${esc(student.grade)} · ${esc(student.browser_status)}</p></div><div class="card-actions"><button class="button button-small button-ghost" data-edit>Edit</button><button class="button button-small button-ghost" data-reset>Reset browser</button><button class="button button-small danger" data-archive>Archive</button></div></header><section class="student-contact-grid"><div><small>Student phone</small><strong>${esc(student.student_phone)}</strong></div><div><small>Guardian</small><strong>${esc(student.guardian_name)}</strong></div><div><small>Guardian WhatsApp</small><strong>${esc(student.guardian_whatsapp)}</strong></div></section><div class="student-month-bar"><label>Month<input id="student-month" type="month" value="${month}"></label><div><small>Amount due</small><strong>Rs. ${esc(summary.combined_amount)}</strong></div><button class="payment-toggle ${unpaid ? "is-unpaid" : "is-paid"}" data-payment ${hasFees ? "" : "disabled"}>${hasFees ? esc(summary.payment_status) : "No fees"}</button>${unpaid ? `<button class="whatsapp-fee ${urgent ? "urgent" : ""}" data-whatsapp aria-label="Send WhatsApp fee reminder">WhatsApp reminder</button>` : ""}</div><section class="student-insight-grid"><article><p class="kicker">Monthly fees</p><details open><summary>${summary.fees.length} class fee${summary.fees.length === 1 ? "" : "s"}</summary>${summary.fees.map((fee) => `<div class="detail-line"><span>${esc(fee.class_name)}</span><strong>Rs. ${esc(fee.amount)} · ${esc(fee.status)}</strong></div>`).join("") || '<p class="muted">No active class fees for this month.</p>'}</details></article><article><p class="kicker">Monthly attendance</p><div class="attendance-totals"><span><strong>${summary.present}</strong>Present</span><span><strong>${summary.absent}</strong>Absent</span><span><strong>${summary.attendance_rate}%</strong>Rate</span></div><details><summary>View class and date breakdown</summary>${summary.attendance.map((record) => `<div class="detail-line"><span>${esc(record.class_name)}<small>${esc(record.attendance_date)}</small></span><strong class="attendance-${record.status.toLowerCase()}">${esc(record.status)}</strong></div>`).join("") || '<p class="muted">No attendance records for this month.</p>'}</details></article></section><dialog id="edit-student-dialog" class="management-dialog"><div class="dialog-heading"><h3>Edit student</h3><button class="icon-button" data-close-edit aria-label="Close">&times;</button></div><form id="detail-student-form" class="grid-form"><label>Full name<input name="full_name" value="${esc(student.full_name)}" required></label><label>Student phone<input name="student_phone" value="${esc(student.student_phone)}" required></label><label>Guardian name<input name="guardian_name" value="${esc(student.guardian_name)}" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" value="${esc(student.guardian_whatsapp)}" required></label><label>Grade<select name="grade"><option ${student.grade === "Grade 10" ? "selected" : ""}>Grade 10</option><option ${student.grade === "Grade 11" ? "selected" : ""}>Grade 11</option></select></label><button class="button">Save changes</button></form></dialog>`;
    document.querySelector("#student-month").onchange = (event) => {
      location.hash = `#student?student=${studentId}&month=${event.target.value}`;
    };
    host.querySelector("[data-payment]").onclick = async () => {
      await api(`/api/students/${studentId}/fees/${month}`, {
        method: "PUT",
        body: JSON.stringify({ status: unpaid ? "Paid" : "Unpaid" }),
      });
      studentDetailPage();
    };
    host
      .querySelector("[data-whatsapp]")
      ?.addEventListener("click", async () => {
        const result = await api(
          `/api/students/${studentId}/fees/${month}/whatsapp`,
        );
        window.open(result.url, "_blank", "noopener");
      });
    host.querySelector("[data-reset]").onclick = async () => {
      await api(`/api/students/${studentId}/reset-browser`, { method: "POST" });
      studentDetailPage();
    };
    host.querySelector("[data-archive]").onclick = async () => {
      if (!confirm("Archive this student?")) return;
      await api(`/api/students/${studentId}`, { method: "DELETE" });
      location.hash = "#students";
    };
    const dialog = document.querySelector("#edit-student-dialog");
    host.querySelector("[data-edit]").onclick = () => dialog.showModal();
    host.querySelector("[data-close-edit]").onclick = () => dialog.close();
    document.querySelector("#detail-student-form").onsubmit = async (event) => {
      event.preventDefault();
      await api(`/api/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      });
      studentDetailPage();
    };
  }
}
