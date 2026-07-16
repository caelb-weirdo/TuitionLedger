import QRCode from "qrcode";
import { api, auth, esc, msg } from "../core/api.js";
import { studentUrl } from "../core/config.js";
import { shell } from "./layout.js";

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
    `<section class="page-intro"><p class="kicker">Student directory</p><h2>Approve and maintain student records.</h2><p class="muted">Approved students receive IDs such as STU001 and one trusted browser. Manage enrollment from Classes.</p></section><div class="data-toolbar"><button id="add-student" class="button">Add student</button><button id="registration-qr" class="button button-ghost">Generate registration QR</button><button id="connection-link" class="button button-ghost">Copy browser setup link</button><button id="refresh-students" class="button button-ghost">Refresh requests</button><input id="student-search" type="search" placeholder="Search students" aria-label="Search students"></div><p class="muted">Browser setup is for students added manually. Send the link with their assigned Student ID; their approval request will appear here.</p><section id="student-content" class="management-records">Loading students...</section>`,
  );
  document.querySelector("#add-student").onclick = () => studentForm();
  document.querySelector("#refresh-students").onclick = studentsPage;
  document.querySelector("#connection-link").onclick = () => {
    const tutor = auth()?.user?.id;
    const url = `${studentUrl}/?connect=true&tutor=${encodeURIComponent(tutor || "")}`;
    navigator.clipboard?.writeText(url);
    document
      .querySelector("#student-content")
      .insertAdjacentHTML(
        "afterbegin",
        msg(
          "Browser setup link copied. Send it with the student's assigned Student ID.",
          "success",
        ),
      );
  };
  document.querySelector("#registration-qr").onclick = async () => {
    const button = document.querySelector("#registration-qr");
    button.disabled = true;
    button.textContent = "Generating QR...";
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
      button.textContent = "Generate registration QR";
    }
  };

  try {
    const [students, requests, browserRequests] = await Promise.all([
      api("/api/students"),
      api("/api/registration-requests"),
      api("/api/browser-requests"),
    ]);
    const pending = requests
      .filter((request) => request.status === "Pending")
      .map(
        (request) =>
          `<article class="record-card pending"><span class="status-pill">Pending approval</span><h3>${esc(request.full_name)}</h3><p>${esc(request.grade)} · ${esc(request.student_phone)}</p><button class="button button-small" data-approve="${request.id}">Approve</button><button class="button button-small button-ghost" data-reject="${request.id}">Reject</button></article>`,
      )
      .join("");
    const approved = students
      .map((student) => {
        const enrolled = student.enrolled_classes || [];
        return `<article class="record-card"><span class="status-pill">${esc(student.student_code)}</span><h3>${esc(student.full_name)}</h3><p>${esc(student.grade)} · ${esc(student.student_phone)}</p><strong>${esc(student.browser_status)}</strong><div class="read-only-enrolment"><small>Enrolled classes</small><p>${enrolled.map((classItem) => esc(classItem.class_name)).join(" · ") || "Not enrolled"}</p></div><div class="card-actions"><button class="button button-small button-ghost" data-edit="${student.id}">Edit</button><button class="button button-small button-ghost" data-reset="${student.id}">Reset browser</button><button class="button button-small danger" data-delete="${student.id}">Delete</button></div></article>`;
      })
      .join("");
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
        await api(
          `/api/browser-requests/${button.dataset.browserReject}/reject`,
          { method: "POST" },
        );
        studentsPage();
      };
    });
    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.onclick = async () => {
        if (confirm("Delete this student?")) {
          await api(`/api/students/${button.dataset.delete}`, {
            method: "DELETE",
          });
          studentsPage();
        }
      };
    });
    host.querySelectorAll("[data-reset]").forEach((button) => {
      button.onclick = async () => {
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
