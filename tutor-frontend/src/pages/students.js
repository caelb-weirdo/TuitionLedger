import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { app, subjects, days } from "../core/config.js";
import { shell } from "./layout.js";
function studentForm(id, existing) {
  const host = document.querySelector("#student-content");
  host.insertAdjacentHTML(
    "afterbegin",
    `<article class="form-card"><h3>${id ? "Edit student" : "Add student"}</h3><form id="student-form" class="grid-form"><label>Full name<input name="full_name" required></label><label>Student phone<input name="student_phone" required></label><label>Guardian name<input name="guardian_name" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" required></label><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><button class="button">Save student</button></form></article>`,
  );
  if (existing) {
    Object.entries(existing).forEach(([k, v]) => {
      const el = document.querySelector(`[name=${k}]`);
      if (el) el.value = v || "";
    });
  }
  document.querySelector("#student-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(id ? `/api/students/${id}` : "/api/students", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      studentsPage();
    } catch (x) {
      e.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(x.message, "error"),
      );
    }
  };
}
export async function studentsPage() {
  shell(
    "students",
    "Students",
    `<section class="page-intro"><p class="kicker">Student directory</p><h2>Approve, edit, and enrol.</h2><p class="muted">Approved students receive IDs such as STU001 and one trusted browser.</p></section><div class="data-toolbar"><button id="add-student" class="button">Add student</button><button id="registration-qr" class="button button-ghost">Generate registration QR</button><input id="student-search" type="search" placeholder="Search students" aria-label="Search students"></div><section id="student-content" class="list-grid">Loading students...</section>`,
  );
  document.querySelector("#add-student").onclick = () => studentForm();
  document.querySelector("#registration-qr").onclick = async () => {
    try {
      const x = await api("/api/registration-qr", { method: "POST" }),
        url = `${studentUrl}/?registration_token=${encodeURIComponent(x.token)}`,
        qr = await QRCode.toDataURL(url, { width: 240 });
      document
        .querySelector("#student-content")
        .insertAdjacentHTML(
          "afterbegin",
          `<article class="qr-card"><h3>Registration QR · valid 24 hours</h3><img src="${qr}" alt="Registration QR"><p>${esc(url)}</p></article>`,
        );
    } catch (e) {
      document.querySelector("#student-content").innerHTML = msg(
        e.message,
        "error",
      );
    }
  };
  try {
    const [ss, rr, cc] = await Promise.all([
      api("/api/students"),
      api("/api/registration-requests"),
      api("/api/classes"),
    ]);
    const pending = rr
        .filter((x) => x.status === "Pending")
        .map(
          (x) =>
            `<article class="record-card pending"><span class="status-pill">Pending approval</span><h3>${esc(x.full_name)}</h3><p>${esc(x.grade)} · ${esc(x.student_phone)}</p><button class="button button-small" data-approve="${x.id}">Approve</button><button class="button button-small button-ghost" data-reject="${x.id}">Reject</button></article>`,
        )
        .join(""),
      approved = ss
        .map(
          (x) =>
            `<article class="record-card"><span class="status-pill">${esc(x.student_code)}</span><h3>${esc(x.full_name)}</h3><p>${esc(x.grade)} · ${esc(x.student_phone)}</p><strong>${esc(x.browser_status)}</strong><div class="card-actions"><button class="button button-small button-ghost" data-edit="${x.id}">Edit</button><button class="button button-small button-ghost" data-reset="${x.id}">Reset browser</button><button class="button button-small danger" data-delete="${x.id}">Delete</button></div><div class="enrol-row"><select data-class-for="${x.id}"><option value="">Choose class to enrol</option>${cc.map((c) => `<option value="${c.id}">${esc(c.grade)} · ${esc(c.subject)} · ${esc(c.class_name)}</option>`).join("")}</select><button class="button button-small" data-enrol="${x.id}">Enrol</button></div></article>`,
        )
        .join("");
    const host = document.querySelector("#student-content");
    host.innerHTML =
      pending + approved ||
      `<article class="record-card"><h3>No students yet</h3><p>Generate a registration QR or add the first student.</p></article>`;
    document.querySelector("#student-search").oninput = (event) => {
      const query = event.target.value.trim().toLowerCase();
      host.querySelectorAll(".record-card").forEach((card) => {
        card.hidden =
          query !== "" && !card.textContent.toLowerCase().includes(query);
      });
    };
    host.querySelectorAll("[data-approve]").forEach(
      (b) =>
        (b.onclick = async () => {
          await api(`/api/registration-requests/${b.dataset.approve}/approve`, {
            method: "POST",
          });
          studentsPage();
        }),
    );
    host.querySelectorAll("[data-reject]").forEach(
      (b) =>
        (b.onclick = async () => {
          await api(`/api/registration-requests/${b.dataset.reject}/reject`, {
            method: "POST",
          });
          studentsPage();
        }),
    );
    host.querySelectorAll("[data-delete]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (confirm("Delete this student?")) {
            await api(`/api/students/${b.dataset.delete}`, {
              method: "DELETE",
            });
            studentsPage();
          }
        }),
    );
    host.querySelectorAll("[data-reset]").forEach(
      (b) =>
        (b.onclick = async () => {
          await api(`/api/students/${b.dataset.reset}/reset-browser`, {
            method: "POST",
          });
          studentsPage();
        }),
    );
    host.querySelectorAll("[data-enrol]").forEach(
      (b) =>
        (b.onclick = async () => {
          const select = host.querySelector(
            `[data-class-for="${b.dataset.enrol}"]`,
          );
          if (!select.value) return;
          await api(`/api/classes/${select.value}/students`, {
            method: "POST",
            body: JSON.stringify({ student_id: b.dataset.enrol }),
          });
          b.textContent = "Enrolled";
          b.disabled = true;
        }),
    );
    host.querySelectorAll("[data-edit]").forEach(
      (b) =>
        (b.onclick = () =>
          studentForm(
            b.dataset.edit,
            ss.find((x) => x.id === b.dataset.edit),
          )),
    );
  } catch (e) {
    document.querySelector("#student-content").innerHTML = msg(
      e.message,
      "error",
    );
  }
}
