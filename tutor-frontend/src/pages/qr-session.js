import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { days } from "../core/config.js";
import { buildStudentUrl } from "../core/student-links.js";
import { shell } from "./layout.js";
import { confirmDialog } from "../ui.js";

export async function qrSessionPage() {
  const classId = new URLSearchParams(location.hash.split("?")[1] || "").get(
    "class",
  );
  shell(
    "classes",
    "Attendance session",
    `<a class="back-link" href="#classes">← Back to classes</a><section id="qr-session-workspace" class="qr-session-page">Loading class...</section>`,
  );
  const host = document.querySelector("#qr-session-workspace");
  try {
    const classItem = await api(`/api/classes/${classId}`);
    host.innerHTML = `<div class="qr-session-heading"><div><p class="kicker">${esc(classItem.grade)} · ${esc(classItem.subject)}</p><h2>${esc(classItem.class_name)}</h2><p class="muted">${esc(days[classItem.day])} · ${esc(classItem.start_time)}–${esc(classItem.end_time)}</p></div></div><form id="start-session-form" class="session-launcher"><label>Attendance date<input type="date" name="attendance_date" value="${new Date().toISOString().slice(0, 10)}" required></label><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option></select></label><button class="button">Start attendance</button></form><div id="qr-session-result" class="qr-session-stage"><p class="muted">Choose the date and duration, then start attendance.</p></div>`;
    document.querySelector("#start-session-form").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector(
        'button[type="submit"], button:not([type])',
      );
      const result = document.querySelector("#qr-session-result");
      submitButton.disabled = true;
      submitButton.textContent = "Starting…";
      try {
        const data = new FormData(form);
        const session = await api("/api/attendance-sessions", {
          method: "POST",
          body: JSON.stringify({
            class_id: classId,
            duration_minutes: data.get("duration_minutes"),
            attendance_date: data.get("attendance_date"),
          }),
        });
        const url = buildStudentUrl(location.origin, {
          attendance_token: session.qr_token,
        });
        const qr = await QRCode.toDataURL(url, { width: 360 });
        const expiresAt = new Date(session.expires_at).getTime();
        result.innerHTML = `<div class="qr-focus"><div class="qr-status-row"><span class="status-pill">Session active</span><strong data-countdown></strong></div><img src="${qr}" alt="Attendance QR for ${esc(classItem.class_name)}"><p>Students scan this code using their approved browser.</p><button class="button danger" data-end-session>End session</button></div>`;
        const countdown = result.querySelector("[data-countdown]");
        let timer = null;
        function expireSession() {
          window.clearInterval(timer);
          submitButton.disabled = false;
          submitButton.textContent = "Start attendance";
          result.innerHTML = `<div class="qr-focus"><span class="status-pill">Expired</span><h3>Session expired</h3><p>Students can no longer use this QR code.</p><button type="button" class="button" data-start-new>Start a new session</button></div>`;
          result.querySelector("[data-start-new]").onclick = () => {
            form.scrollIntoView({ behavior: "smooth", block: "center" });
            form.querySelector("select, input")?.focus();
          };
        }
        const updateCountdown = () => {
          const seconds = Math.max(
            0,
            Math.ceil((expiresAt - Date.now()) / 1000),
          );
          if (!seconds) {
            expireSession();
            return;
          }
          countdown.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`;
        };
        updateCountdown();
        if (expiresAt > Date.now()) {
          timer = window.setInterval(updateCountdown, 1000);
        }
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
          window.clearInterval(timer);
          submitButton.disabled = false;
          submitButton.textContent = "Start attendance";
          result.innerHTML = `${msg("Attendance session ended.", "success")}<button type="button" class="button" data-start-new>Start a new session</button><a class="button secondary" href="#classes">Return to classes</a>`;
          result.querySelector("[data-start-new]").onclick = () => {
            form.scrollIntoView({ behavior: "smooth", block: "center" });
          };
        };
      } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = "Start attendance";
        result.innerHTML = msg(error.message, "error");
      }
    };
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }
}
