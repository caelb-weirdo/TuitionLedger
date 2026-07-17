import { api, esc, msg } from "../core/api.js";
import { confirmDialog } from "../ui.js";
import { shell } from "./layout.js";

function formatSubmitted(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export async function registrationRequestPage() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const requestId = params.get("request");
  shell(
    "students",
    "Registration request",
    '<a class="back-link" href="#students">← Back to students</a><section id="registration-request-detail" class="registration-request-page">Loading registration request…</section>',
  );
  const host = document.querySelector("#registration-request-detail");
  try {
    const requests = await api("/api/registration-requests", { force: true });
    const registration = requests.find((item) => item.id === requestId);
    if (!registration) {
      host.innerHTML =
        '<div class="empty-state"><h2 tabindex="-1">Registration request not found</h2><p>It may already have been removed or may belong to another tutor.</p></div>';
      host.querySelector("h2").focus();
      return;
    }
    render(registration);
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }

  function render(registration) {
    const pending = registration.status === "Pending";
    host.innerHTML = `<header class="student-record-head registration-request-head"><div><span class="status-pill">${esc(registration.status)}</span><h2 tabindex="-1">${esc(registration.full_name)}</h2><p>${esc(registration.grade)} · submitted ${esc(formatSubmitted(registration.submitted_at))}</p></div>${
      pending
        ? '<div class="card-actions"><button class="button" data-approve-request>Approve student</button><button class="button button-ghost danger" data-reject-request>Reject registration</button></div>'
        : ""
    }</header><section class="student-contact-grid registration-request-details"><div><small>Student phone</small><strong>${esc(registration.student_phone)}</strong></div><div><small>Guardian name</small><strong>${esc(registration.guardian_name)}</strong></div><div><small>Guardian WhatsApp</small><strong>${esc(registration.guardian_whatsapp)}</strong></div><div><small>Grade</small><strong>${esc(registration.grade)}</strong></div><div><small>Status</small><strong>${esc(registration.status)}</strong></div><div><small>Submitted</small><strong>${esc(formatSubmitted(registration.submitted_at))}</strong></div></section><p id="registration-request-notice" class="form-notice" role="status" aria-live="polite"></p>`;
    host.querySelector("h2").focus();
    if (!pending) return;
    const notice = document.querySelector("#registration-request-notice");
    const approve = host.querySelector("[data-approve-request]");
    const reject = host.querySelector("[data-reject-request]");

    async function review(action, button) {
      approve.disabled = true;
      reject.disabled = true;
      notice.textContent =
        action === "approve" ? "Approving student…" : "Rejecting request…";
      try {
        await api(`/api/registration-requests/${registration.id}/${action}`, {
          method: "POST",
        });
        sessionStorage.setItem(
          "tuitionledger:student-notice",
          action === "approve"
            ? `${registration.full_name} approved as a student.`
            : `${registration.full_name}'s registration was rejected.`,
        );
        location.hash = "#students";
      } catch (error) {
        notice.textContent = error.message;
        notice.className = "form-notice error";
        approve.disabled = false;
        reject.disabled = false;
        button.focus();
      }
    }

    approve.onclick = () => review("approve", approve);
    reject.onclick = async () => {
      if (
        !(await confirmDialog({
          title: "Reject this registration?",
          message:
            "The student will see that this registration request was rejected.",
          confirmLabel: "Reject request",
          danger: true,
        }))
      )
        return;
      await review("reject", reject);
    };
  }
}
