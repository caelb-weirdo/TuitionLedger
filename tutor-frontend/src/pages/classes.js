import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { days, studentUrl, subjects } from "../core/config.js";
import { shell } from "./layout.js";

export async function classesPage() {
  shell(
    "classes",
    "Classes",
    `<section class="page-intro"><p class="kicker">Class control desk</p><h2>Plan the class, enrol the room, start attendance.</h2><p class="muted">Each class owns its schedule, student list, and short-lived attendance QR.</p></section><article class="form-card"><h3 id="class-form-title">Create class</h3><form id="class-form" class="grid-form"><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><label>Subject<select name="subject">${subjects.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Class name<input name="class_name" required></label><label>Day<select name="day">${days.map((x, i) => `<option value="${i}">${x}</option>`).join("")}</select></label><label>Start time<input type="time" name="start_time" required></label><label>End time<input type="time" name="end_time" required></label><label>Monthly fee<input type="number" name="monthly_fee" min="0" required></label><div class="card-actions"><button class="button">Save class</button><button id="cancel-class-edit" class="button button-ghost" type="button" hidden>Cancel</button></div></form></article><section id="class-list" class="class-workspaces">Loading classes...</section>`,
  );

  const form = document.querySelector("#class-form");
  let editingClass = null;
  const resetForm = () => {
    editingClass = null;
    form.reset();
    document.querySelector("#class-form-title").textContent = "Create class";
    form.querySelector('button[type="submit"], button:not([type])').textContent = "Save class";
    document.querySelector("#cancel-class-edit").hidden = true;
  };
  document.querySelector("#cancel-class-edit").onclick = resetForm;
  form.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api(editingClass ? `/api/classes/${editingClass.id}` : "/api/classes", {
        method: editingClass ? "PUT" : "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      classesPage();
    } catch (error) {
      form.insertAdjacentHTML("beforebegin", msg(error.message, "error"));
    }
  };

  try {
    const [classes, students] = await Promise.all([
      api("/api/classes"),
      api("/api/students"),
    ]);
    const rosters = new Map(
      await Promise.all(
        classes.map(async (classItem) => [
          classItem.id,
          await api(`/api/classes/${classItem.id}/students`),
        ]),
      ),
    );
    const host = document.querySelector("#class-list");
    host.innerHTML =
      classes
        .map((classItem) => {
          const enrolled = rosters.get(classItem.id) || [];
          const available = students.filter(
            (student) => !enrolled.some((item) => item.id === student.id),
          );
          return `<article class="class-workspace" data-class="${classItem.id}"><header class="class-workspace-header"><div><span class="status-pill">${esc(classItem.grade)} · ${esc(classItem.subject)}</span><h3>${esc(classItem.class_name)}</h3><p>${esc(days[classItem.day])} · ${esc(classItem.start_time)}–${esc(classItem.end_time)} · Rs. ${esc(classItem.monthly_fee)}/month</p></div><div class="card-actions"><button class="button button-small button-ghost" data-edit="${classItem.id}">Edit</button><button class="button button-small danger" data-delete="${classItem.id}">Delete</button></div></header><div class="class-workspace-grid"><section><div class="section-heading"><p class="kicker">Enrolled students</p><h4>${enrolled.length} student${enrolled.length === 1 ? "" : "s"}</h4></div><div class="class-roster">${enrolled.map((student) => `<div class="class-roster-row"><span><strong>${esc(student.full_name)}</strong><small>${esc(student.student_code)}</small></span><button class="button button-small button-ghost" data-remove-student="${student.id}">Remove</button></div>`).join("") || '<p class="muted">No students enrolled yet.</p>'}</div><div class="enrol-row"><select data-student-select><option value="">${available.length ? "Choose a student" : "All students enrolled"}</option>${available.map((student) => `<option value="${student.id}">${esc(student.student_code)} · ${esc(student.full_name)}</option>`).join("")}</select><button class="button button-small" data-enrol ${available.length ? "" : "disabled"}>Enrol</button></div></section><section class="session-desk"><div class="section-heading"><p class="kicker">Attendance session</p><h4>Open the room QR</h4></div><form data-session-form class="session-form"><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button">Generate QR</button></form><div data-session-result class="session-result"><p class="muted">No active session from this screen.</p></div></section></div></article>`;
        })
        .join("") ||
      `<article class="record-card"><h3>No classes yet</h3><p>Create your first class to enrol students and start attendance.</p></article>`;

    host.querySelectorAll("[data-class]").forEach((card) => {
      const classId = card.dataset.class;
      card
        .querySelector("[data-session-form]")
        .insertAdjacentHTML(
          "afterbegin",
          `<label>Attendance date<input type="date" name="attendance_date" value="${new Date().toISOString().slice(0, 10)}" required></label>`,
        );
      card.querySelector("[data-edit]").onclick = () => {
        editingClass = classes.find((item) => item.id === classId);
        Object.entries(editingClass).forEach(([key, value]) => {
          const field = form.elements.namedItem(key);
          if (field && value != null) field.value = value;
        });
        document.querySelector("#class-form-title").textContent = "Edit class";
        form.querySelector('button[type="submit"], button:not([type])').textContent = "Update class";
        document.querySelector("#cancel-class-edit").hidden = false;
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      card.querySelector("[data-delete]").onclick = async () => {
        if (confirm("Delete this class?")) {
          await api(`/api/classes/${classId}`, { method: "DELETE" });
          classesPage();
        }
      };
      card.querySelector("[data-enrol]").onclick = async () => {
        const studentId = card.querySelector("[data-student-select]").value;
        if (!studentId) return;
        await api(`/api/classes/${classId}/students`, {
          method: "POST",
          body: JSON.stringify({ student_id: studentId }),
        });
        classesPage();
      };
      card.querySelectorAll("[data-remove-student]").forEach((button) => {
        button.onclick = async () => {
          await api(`/api/classes/${classId}/students/${button.dataset.removeStudent}`, { method: "DELETE" });
          classesPage();
        };
      });
      card.querySelector("[data-session-form]").onsubmit = async (event) => {
        event.preventDefault();
        const result = card.querySelector("[data-session-result]");
        try {
          const session = await api("/api/attendance-sessions", {
            method: "POST",
            body: JSON.stringify({
              class_id: classId,
              duration_minutes: new FormData(event.currentTarget).get("duration_minutes"),
              attendance_date: new FormData(event.currentTarget).get("attendance_date"),
            }),
          });
          const url = `${studentUrl}/?attendance_token=${encodeURIComponent(session.qr_token)}`;
          const qr = await QRCode.toDataURL(url, { width: 260 });
          const expiresAt = new Date(session.expires_at).getTime();
          result.innerHTML = `<div class="qr-card compact"><span class="status-pill">Active</span><img src="${qr}" alt="Attendance QR for ${esc(classItemName(classes, classId))}"><p>Students scan with their approved browser.</p><strong data-countdown></strong><button class="button button-small" data-end-session>End session</button></div>`;
          const countdown = result.querySelector("[data-countdown]");
          let timer = null;
          const updateCountdown = () => {
            const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
            countdown.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`;
            if (!seconds) window.clearInterval(timer);
          };
          updateCountdown();
          timer = window.setInterval(updateCountdown, 1000);
          result.querySelector("[data-end-session]").onclick = async () => {
            await api(`/api/attendance-sessions/${session.id}/end`, { method: "POST" });
            window.clearInterval(timer);
            result.innerHTML = msg("Attendance session ended.", "success");
          };
        } catch (error) {
          result.innerHTML = msg(error.message, "error");
        }
      };
    });
  } catch (error) {
    document.querySelector("#class-list").innerHTML = msg(error.message, "error");
  }
}

function classItemName(classes, classId) {
  return classes.find((item) => item.id === classId)?.class_name || "class";
}
