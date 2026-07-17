import QRCode from "qrcode";
import { api, clearApiCache, esc, msg } from "../core/api.js";
import { studentUrl } from "../core/config.js";
import { shell } from "./layout.js";
import { confirmDialog } from "../ui.js";

function studentForm(id, existing) {
  const host = document.querySelector("#student-content");
  host.insertAdjacentHTML(
    "afterbegin",
    `<article class="form-card"><h3>${id ? "Edit student" : "Add student"}</h3><form id="student-form" class="grid-form"><label>Full name<input name="full_name" required></label><label>Student phone<input name="student_phone" required></label><label>Guardian name<input name="guardian_name" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" required></label><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><button class="button">Save student</button></form></article>`,
  );
  if (existing) {
    Object.entries(existing).forEach(([key, value]) => {
      const field = document.querySelector(`[name=${key}]`);
      if (field) field.value = value || "";
    });
  }
  document.querySelector("#student-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api(id ? `/api/students/${id}` : "/api/students", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget)),
        ),
      });
      studentsPage();
    } catch (error) {
      event.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(error.message, "error"),
      );
    }
  };
}

export async function studentsPage() {
  if (window.__studentsRefreshTimer) {
    window.clearInterval(window.__studentsRefreshTimer);
    window.__studentsRefreshTimer = null;
  }
  shell(
    "students",
    "Students",
    `<section class="page-intro"><p class="kicker">Student directory</p><h2>Approve and maintain student records.</h2><p class="muted">Approved students receive IDs such as STU001 and one trusted browser. Manage enrollment from Classes.</p></section><div class="data-toolbar icon-toolbar"><button id="add-student" class="icon-action primary" aria-label="Add student" data-tooltip="Add student"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button><button id="registration-qr" class="icon-action" aria-label="Generate registration QR" data-tooltip="Generate registration QR"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM19 14h1v6h-6v-2h4v-2h-3z"/></svg></button><button id="refresh-students" class="icon-action" aria-label="Refresh requests" data-tooltip="Refresh requests"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8m16 8-2.2 1.8A7 7 0 0 1 5.5 15"/></svg></button><input id="student-search" type="search" placeholder="Search students" aria-label="Search students"></div><section id="student-content" class="management-records">Loading students...</section>`,
  );
  document.querySelector("#add-student").onclick = () => studentForm();
  document.querySelector("#refresh-students").onclick = () => {
    clearApiCache();
    studentsPage();
  };
  document.querySelector("#registration-qr").onclick = async () => {
    const button = document.querySelector("#registration-qr");
    button.disabled = true;
    try {
      const registration = await api("/api/registration-qr", {
        method: "POST",
      });
      const url = `${studentUrl}/?registration_token=${encodeURIComponent(registration.token)}`;
      const qr = await QRCode.toDataURL(url, { width: 240 });
      document
        .querySelector("#student-content")
        .insertAdjacentHTML(
          "afterbegin",
          `<article class="qr-card"><h3>Registration QR · valid for 24 hours</h3><img src="${qr}" alt="Registration QR"><p>${esc(url)}</p></article>`,
        );
    } catch (error) {
      document.querySelector("#student-content").innerHTML = msg(
        error.message,
        "error",
      );
    } finally {
      button.disabled = false;
    }
  };

  try {
    const overview = await api("/api/students/overview");
    const students = overview.students;
    const requests = overview.registration_requests;
    const browserRequests = overview.browser_requests;
    const pending = requests
      .filter((request) => request.status === "Pending")
      .map(
        (request) =>
          `<article class="record-card pending"><span class="status-pill">Pending approval</span><h3>${esc(request.full_name)}</h3><p>${esc(request.grade)} · ${esc(request.student_phone)}</p><button class="button button-small" data-approve="${request.id}">Approve</button><button class="button button-small button-ghost" data-reject="${request.id}">Reject</button></article>`,
      )
      .join("");
    const approved = `<div class="student-directory"><div class="student-directory-head"><span>Student</span><span>Grade</span><span>Browser</span><span></span></div>${students
      .map(
        (student) =>
          `<a class="student-directory-row record-card" href="#student?student=${student.id}"><span><strong>${esc(student.full_name)}</strong><small>${esc(student.student_code)}</small></span><span>${esc(student.grade)}</span><span class="status-pill">${esc(student.browser_status)}</span><span class="view-student">View →</span></a>`,
      )
      .join("")}</div>`;
    const pendingBrowsers = browserRequests
      .filter((item) => item.status === "Pending")
      .map(
        (item) =>
          `<article class="management-row pending"><div><span class="status-pill">Browser pending</span><h3>${esc(item.full_name)}</h3><p>${esc(item.student_code)}</p></div><div class="card-actions"><button class="button button-small" data-browser-approve="${item.id}">Approve browser</button><button class="button button-small button-ghost" data-browser-reject="${item.id}">Reject</button></div></article>`,
      )
      .join("");
    const host = document.querySelector("#student-content");
    host.innerHTML =
      pending + pendingBrowsers + approved ||
      `<article class="record-card"><h3>No students yet</h3><p>Generate a registration QR or add the first student.</p></article>`;
    document.querySelector("#student-search").oninput = (event) => {
      const query = event.target.value.trim().toLowerCase();
      host.querySelectorAll(".record-card").forEach((card) => {
        card.hidden = query && !card.textContent.toLowerCase().includes(query);
      });
    };
    host.querySelectorAll("[data-approve]").forEach((button) => {
      button.onclick = async () => {
        await api(
          `/api/registration-requests/${button.dataset.approve}/approve`,
          { method: "POST" },
        );
        studentsPage();
      };
    });
    host.querySelectorAll("[data-reject]").forEach((button) => {
      button.onclick = async () => {
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
        await api(
          `/api/registration-requests/${button.dataset.reject}/reject`,
          { method: "POST" },
        );
        studentsPage();
      };
    });
    host.querySelectorAll("[data-browser-approve]").forEach((button) => {
      button.onclick = async () => {
        await api(
          `/api/browser-requests/${button.dataset.browserApprove}/approve`,
          { method: "POST" },
        );
        studentsPage();
      };
    });
    host.querySelectorAll("[data-browser-reject]").forEach((button) => {
      button.onclick = async () => {
        if (
          !(await confirmDialog({
            title: "Reject this browser?",
            message: "This browser will not be able to record attendance.",
            confirmLabel: "Reject browser",
            danger: true,
          }))
        )
          return;
        await api(
          `/api/browser-requests/${button.dataset.browserReject}/reject`,
          { method: "POST" },
        );
        studentsPage();
      };
    });
    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.onclick = async () => {
        if (
          await confirmDialog({
            title: "Archive this student?",
            message:
              "The student will leave active lists while historical attendance and fees remain.",
            confirmLabel: "Archive student",
            danger: true,
          })
        ) {
          await api(`/api/students/${button.dataset.delete}`, {
            method: "DELETE",
          });
          studentsPage();
        }
      };
    });
    host.querySelectorAll("[data-reset]").forEach((button) => {
      button.onclick = async () => {
        if (
          !(await confirmDialog({
            title: "Replace approved browser?",
            message:
              "The current browser will immediately stop working for attendance until a new request is approved.",
            confirmLabel: "Reset browser",
            danger: true,
          }))
        )
          return;
        await api(`/api/students/${button.dataset.reset}/reset-browser`, {
          method: "POST",
        });
        studentsPage();
      };
    });
    host.querySelectorAll("[data-edit]").forEach((button) => {
      button.onclick = () =>
        studentForm(
          button.dataset.edit,
          students.find((student) => student.id === button.dataset.edit),
        );
    });
  } catch (error) {
    document.querySelector("#student-content").innerHTML = msg(
      error.message,
      "error",
    );
  }
}
