import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { days } from "../core/config.js";
import { classAvailability } from "../core/schedule.js";
import { buildStudentUrl } from "../core/student-links.js";
import { confirmDialog, formatDate } from "../ui.js";
import { shell } from "./layout.js";

export async function qrSessionPage() {
  const classId = new URLSearchParams(location.hash.split("?")[1] || "").get(
    "class",
  );
  shell(
    "classes",
    "Attendance session",
    `<a class="back-link" href="#classes">← Back to classes</a><section id="qr-session-workspace" class="qr-session-page">Loading class…</section>`,
  );
  const host = document.querySelector("#qr-session-workspace");
  try {
    const classItem = await api(`/api/classes/${classId}`, { force: true });
    const availability = classAvailability(classItem);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
    }).format(new Date());
    host.innerHTML = `<div class="qr-session-heading"><div><p class="kicker">${esc(classItem.grade)} · ${esc(classItem.subject)}</p><h2>${esc(classItem.class_name)}</h2><p class="muted">${esc(days[classItem.day])} · ${esc(classItem.start_time)}–${esc(classItem.end_time)}</p></div><span class="availability-badge ${availability.state}">${esc(availability.label)}</span></div><form id="start-session-form" class="session-launcher"><p><strong>Attendance date</strong><br>${formatDate(today)} <span class="muted">· Colombo time</span></p><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10" selected>10 minutes</option><option value="15">15 minutes</option></select></label><button class="button">Start Attendance</button></form><div id="qr-session-result" class="qr-session-stage" aria-live="polite"><p class="muted">The server will check this class’s schedule before creating a QR.</p></div><dialog id="extra-session-dialog" class="management-dialog"><form id="extra-session-form"><div class="dialog-heading"><div><p class="kicker">Outside timetable</p><h3>Start an extra session?</h3></div><button type="button" class="icon-button" data-close-extra aria-label="Close">×</button></div><p id="schedule-explanation"></p><label>Reason<select name="override_reason" required><option value="">Choose a reason</option><option>Rescheduled class</option><option>Replacement class</option><option>Special class</option><option>Other</option></select></label><label data-other-reason hidden>Other reason<textarea name="other_reason" minlength="3" maxlength="300"></textarea></label><p class="form-notice" data-extra-notice role="status"></p><div class="dialog-actions"><button type="button" class="button button-ghost" data-close-extra>Cancel</button><button class="button">Start extra session</button></div></form></dialog>`;
    const form = document.querySelector("#start-session-form");
    const result = document.querySelector("#qr-session-result");
    const extraDialog = document.querySelector("#extra-session-dialog");
    let pendingDuration = "10";

    async function launch(payload) {
      const session = await api("/api/attendance-sessions", {
        method: "POST",
        body: JSON.stringify({
          class_id: classId,
          duration_minutes: pendingDuration,
          ...payload,
        }),
      });
      const url = buildStudentUrl(location.origin, {
        attendance_token: session.qr_token,
      });
      const qr = await QRCode.toDataURL(url, { width: 420 });
      const expiresAt = new Date(session.expires_at).getTime();
      form.hidden = true;
      result.innerHTML = `<div class="qr-focus" data-fullscreen-qr><div class="qr-status-row"><span class="status-pill">${session.is_extra_session ? "Extra session" : "Session active"}</span><strong data-countdown></strong></div>${session.override_reason ? `<p class="muted tutor-only">Reason: ${esc(session.override_reason)}</p>` : ""}<img src="${qr}" alt="Attendance QR for ${esc(classItem.class_name)}"><p>${esc(classItem.class_name)} · <strong>0</strong> present / ${Number(classItem.student_count || 0)} expected</p><div class="card-actions"><button type="button" class="button button-ghost" data-fullscreen>Full Screen QR</button><button type="button" class="button danger" data-end-session>End Session</button></div></div>`;
      const countdown = result.querySelector("[data-countdown]");
      let timer;
      function expireSession() {
        clearInterval(timer);
        result.innerHTML = `<div class="qr-focus"><span class="status-pill">Expired</span><h3>Session expired</h3><p>Students can no longer use this QR code.</p><a class="button" href="#attendance">View Attendance</a></div>`;
      }
      const tick = () => {
        const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        if (!seconds) return expireSession();
        countdown.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining${seconds <= 60 ? " · Final minute" : ""}`;
      };
      tick();
      timer = setInterval(tick, 1000);
      result.querySelector("[data-fullscreen]").onclick = () =>
        result.querySelector("[data-fullscreen-qr]").requestFullscreen();
      result.querySelector("[data-end-session]").onclick = async () => {
        if (
          !(await confirmDialog({
            title: "End attendance session?",
            message: "Students will no longer be able to scan this QR code.",
            confirmLabel: "End session",
            danger: true,
          }))
        )
          return;
        await api(`/api/attendance-sessions/${session.id}/end`, {
          method: "POST",
        });
        clearInterval(timer);
        result.innerHTML = `${msg("Attendance session ended.", "success")}<p>Review present and absent students in the permanent register.</p><a class="button" href="#attendance">View Attendance</a>`;
      };
    }

    form.onsubmit = async (event) => {
      event.preventDefault();
      const button = event.submitter;
      pendingDuration = new FormData(form).get("duration_minutes");
      button.disabled = true;
      button.textContent = "Checking schedule…";
      try {
        await launch({});
      } catch (error) {
        if (error.code === "ACTIVE_SESSION_EXISTS")
          location.hash = `#qr-session?class=${classId}`;
        else if (error.code === "OUTSIDE_CLASS_SCHEDULE") {
          document.querySelector("#schedule-explanation").textContent =
            `${error.data.class_schedule}. Normal window: ${new Date(error.data.allowed_from).toLocaleString()} to ${new Date(error.data.allowed_until).toLocaleTimeString()}.`;
          extraDialog.showModal();
        } else result.innerHTML = msg(error.message, "error");
      } finally {
        button.disabled = false;
        button.textContent = "Start Attendance";
      }
    };
    document
      .querySelectorAll("[data-close-extra]")
      .forEach((button) => (button.onclick = () => extraDialog.close()));
    const extraForm = document.querySelector("#extra-session-form");
    extraForm.elements.override_reason.onchange = () =>
      (document.querySelector("[data-other-reason]").hidden =
        extraForm.elements.override_reason.value !== "Other");
    extraForm.onsubmit = async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(extraForm));
      const other = String(values.other_reason || "").trim();
      if (
        values.override_reason === "Other" &&
        (other.length < 3 || other.length > 300)
      )
        return (document.querySelector("[data-extra-notice]").textContent =
          "Other reason must be between 3 and 300 characters.");
      event.submitter.disabled = true;
      try {
        await launch({
          is_extra_session: true,
          override_reason: values.override_reason,
          other_reason: other,
        });
        extraDialog.close();
      } catch (error) {
        document.querySelector("[data-extra-notice]").textContent =
          error.message;
      } finally {
        event.submitter.disabled = false;
      }
    };
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }
}
