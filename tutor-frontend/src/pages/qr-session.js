import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { days, studentUrl } from "../core/config.js";
import { shell } from "./layout.js";

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
    const classes = await api("/api/classes");
    const classItem = classes.find((item) => item.id === classId);
    if (!classItem) throw new Error("Class not found.");
    host.innerHTML = `<div class="qr-session-heading"><div><p class="kicker">${esc(classItem.grade)} · ${esc(classItem.subject)}</p><h2>${esc(classItem.class_name)}</h2><p class="muted">${esc(days[classItem.day])} · ${esc(classItem.start_time)}–${esc(classItem.end_time)}</p></div></div><form id="start-session-form" class="session-launcher"><label>Attendance date<input type="date" name="attendance_date" value="${new Date().toISOString().slice(0, 10)}" required></label><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button">Generate QR</button></form><div id="qr-session-result" class="qr-session-stage"><p class="muted">Choose the date and duration, then generate the attendance QR.</p></div>`;
    document.querySelector("#start-session-form").onsubmit = async (event) => {
      event.preventDefault();
      const result = document.querySelector("#qr-session-result");
      try {
        const data = new FormData(event.currentTarget);
        const session = await api("/api/attendance-sessions", {
          method: "POST",
          body: JSON.stringify({
            class_id: classId,
            duration_minutes: data.get("duration_minutes"),
            attendance_date: data.get("attendance_date"),
          }),
        });
        const url = `${studentUrl}/?attendance_token=${encodeURIComponent(session.qr_token)}`;
        const qr = await QRCode.toDataURL(url, { width: 360 });
        const expiresAt = new Date(session.expires_at).getTime();
        result.innerHTML = `<div class="qr-focus"><div class="qr-status-row"><span class="status-pill">Session active</span><strong data-countdown></strong></div><img src="${qr}" alt="Attendance QR for ${esc(classItem.class_name)}"><p>Students scan this code using their approved browser.</p><button class="button danger" data-end-session>End session</button></div>`;
        const countdown = result.querySelector("[data-countdown]");
        let timer = null;
        const updateCountdown = () => {
          const seconds = Math.max(
            0,
            Math.ceil((expiresAt - Date.now()) / 1000),
          );
          countdown.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`;
          if (!seconds) window.clearInterval(timer);
        };
        updateCountdown();
        timer = window.setInterval(updateCountdown, 1000);
        result.querySelector("[data-end-session]").onclick = async () => {
          await api(`/api/attendance-sessions/${session.id}/end`, {
            method: "POST",
          });
          window.clearInterval(timer);
          result.innerHTML = `${msg("Attendance session ended.", "success")}<a class="button" href="#classes">Return to classes</a>`;
        };
      } catch (error) {
        result.innerHTML = msg(error.message, "error");
      }
    };
  } catch (error) {
    host.innerHTML = msg(error.message, "error");
  }
}
