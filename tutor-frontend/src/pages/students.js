import QRCode from "qrcode";
import { api, esc, msg } from "../core/api.js";
import { buildStudentUrl } from "../core/student-links.js";
import { confirmDialog } from "../ui.js";
import { shell } from "./layout.js";

const addIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const qrIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM19 14h1v6h-6v-2h4v-2h-3z"/></svg>';
const refreshIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8m16 8-2.2 1.8A7 7 0 0 1 5.5 15"/></svg>';

function studentForm(onSaved) {
  const host = document.querySelector("#approved-student-content");
  host.querySelector(".form-card")?.remove();
  host.insertAdjacentHTML(
    "afterbegin",
    '<article class="form-card"><h3>Add student</h3><form id="student-form" class="grid-form"><label>Full name<input name="full_name" required></label><label>Student phone<input name="student_phone" required></label><label>Guardian name<input name="guardian_name" required></label><label>Guardian WhatsApp<input name="guardian_whatsapp" required></label><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><button class="button">Save student</button></form></article>',
  );
  const form = document.querySelector("#student-form");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const submit = event.submitter;
    submit.disabled = true;
    try {
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.closest(".form-card").remove();
      await onSaved();
    } catch (error) {
      form
        .closest(".form-card")
        .insertAdjacentHTML("afterbegin", msg(error.message, "error"));
    } finally {
      submit.disabled = false;
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
    `<section class="page-intro"><p class="kicker">Student directory</p><h2>Approve and maintain student records.</h2><p class="muted">Choose one focused section and keep your place while requests update.</p></section>
    <div class="student-tabs" role="tablist" aria-label="Student sections"><button role="tab" aria-selected="true" data-student-tab="students">Students</button><button role="tab" aria-selected="false" data-student-tab="approvals">Approvals <span class="pending-count" data-pending-count>0</span></button><button role="tab" aria-selected="false" data-student-tab="registration">Registration QR</button></div>
    <section class="student-workspace-section panel" data-student-panel="registration" hidden aria-labelledby="registration-heading"><div class="student-section-heading"><div><p class="kicker">Registration</p><h2 id="registration-heading">Registration QR</h2><p class="muted">Students scan this QR to submit a registration request.</p></div><button id="registration-qr" class="icon-action primary" aria-label="Generate registration QR" data-tooltip="Generate registration QR">${qrIcon}</button></div><div id="registration-qr-output" class="registration-qr-output"><div class="empty-state compact"><h3>No active QR</h3><p>Generate a QR when students are ready to register.</p></div></div></section>
    <section class="student-workspace-section" data-student-panel="approvals" hidden aria-labelledby="approvals-heading"><div class="student-section-heading"><div><p class="kicker">Incoming requests</p><h2 id="approvals-heading">Approvals</h2><p class="muted">Open student registrations for full details. Browser requests stay here for quick review.</p></div></div><p id="approval-notice" class="form-notice" role="status" aria-live="polite"></p><div id="approval-content" class="approval-list">Loading approvals…</div></section>
    <section class="student-workspace-section" data-student-panel="students" aria-labelledby="approved-heading"><div class="student-section-heading approved-student-heading"><div><p class="kicker">Directory</p><h2 id="approved-heading">Approved students</h2><p class="muted">Refresh and search this directory without changing the QR or approvals above.</p></div><div class="data-toolbar icon-toolbar"><button id="add-student" class="icon-action primary" aria-label="Add student" data-tooltip="Add student">${addIcon}</button><button id="refresh-approved-students" class="icon-action" aria-label="Refresh approved students" data-tooltip="Refresh approved students">${refreshIcon}</button><input id="student-search" type="search" placeholder="Search approved students" aria-label="Search approved students"></div></div><p id="approved-student-notice" class="form-notice" role="status" aria-live="polite"></p><div id="approved-student-content" class="management-records">Loading approved students…</div></section>`,
  );

  const approvalHost = document.querySelector("#approval-content");
  const approvalNotice = document.querySelector("#approval-notice");
  const approvedHost = document.querySelector("#approved-student-content");
  const approvedNotice = document.querySelector("#approved-student-notice");
  const search = document.querySelector("#student-search");
  const activateTab = (name) => {
    document.querySelectorAll("[data-student-tab]").forEach((tab) => {
      const active = tab.dataset.studentTab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document
      .querySelectorAll("[data-student-panel]")
      .forEach((panel) => (panel.hidden = panel.dataset.studentPanel !== name));
  };
  document.querySelectorAll("[data-student-tab]").forEach((tab) => {
    tab.onclick = () => activateTab(tab.dataset.studentTab);
    tab.onkeydown = (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const tabs = [...document.querySelectorAll("[data-student-tab]")];
      const next =
        (tabs.indexOf(tab) +
          (event.key === "ArrowRight" ? 1 : -1) +
          tabs.length) %
        tabs.length;
      tabs[next].click();
      tabs[next].focus();
    };
  });
  const savedNotice = sessionStorage.getItem("tuitionledger:student-notice");
  if (savedNotice) {
    approvalNotice.textContent = savedNotice;
    approvalNotice.className = "form-notice success";
    sessionStorage.removeItem("tuitionledger:student-notice");
  }

  function applyStudentSearch() {
    const query = search.value.trim().toLowerCase();
    approvedHost.querySelectorAll(".student-directory-row").forEach((row) => {
      row.hidden = Boolean(
        query && !row.textContent.toLowerCase().includes(query),
      );
    });
  }

  function renderApprovedStudents(students) {
    approvedHost.innerHTML = students.length
      ? `<div class="student-directory"><div class="student-directory-head"><span>Student</span><span>Grade</span><span>Browser</span><span></span></div>${students
          .map(
            (student) =>
              `<a class="student-directory-row record-card" href="#student?student=${student.id}"><span><strong>${esc(student.full_name)}</strong><small>${esc(student.student_code)}</small></span><span>${esc(student.grade)}</span><span class="status-pill">${esc(student.browser_status)}</span><span class="view-student">View →</span></a>`,
          )
          .join("")}</div>`
      : '<div class="empty-state"><h3>No approved students</h3><p>Generate a registration QR or add the first student manually.</p></div>';
    applyStudentSearch();
  }

  function renderApprovals(registrationRequests, browserRequests) {
    const registrations = registrationRequests.filter(
      (request) => request.status === "Pending",
    );
    const browsers = browserRequests.filter(
      (request) => request.status === "Pending",
    );
    document.querySelector("[data-pending-count]").textContent =
      registrations.length + browsers.length;
    approvalHost.innerHTML =
      `${registrations
        .map(
          (request) =>
            `<a class="approval-row record-card pending" href="#registration-request?request=${request.id}"><span><span class="status-pill">Student registration</span><strong>${esc(request.full_name)}</strong><small>${esc(request.grade)} · ${esc(request.student_phone)}</small></span><span class="view-student">Review →</span></a>`,
        )
        .join(
          "",
        )}${browsers.length ? '<div class="bulk-approval-toolbar"><span><strong data-browser-selected-count>0</strong> selected</span><button class="button button-small" type="button" data-bulk-browser-approve disabled>Approve selected</button></div>' : ""}${browsers
        .map(
          (request) =>
            `<article class="approval-row record-card pending"><label class="browser-approval-select"><input type="checkbox" data-browser-select value="${request.id}"><span class="sr-only">Select browser request for ${esc(request.full_name)}</span></label><span><span class="status-pill">Browser request</span><strong>${esc(request.full_name)}</strong><small>${esc(request.student_code)}</small></span><span class="card-actions"><button class="button button-small" data-browser-approve="${request.id}">Approve browser</button><button class="button button-small button-ghost" data-browser-reject="${request.id}">Reject</button></span></article>`,
        )
        .join("")}` ||
      '<div class="empty-state compact"><h3>No pending approvals</h3><p>New registration and browser requests will appear here.</p></div>';
    bindBrowserActions();
  }

  async function refreshApprovedStudents() {
    const button = document.querySelector("#refresh-approved-students");
    button.disabled = true;
    approvedNotice.textContent = "Refreshing approved students…";
    approvedNotice.className = "form-notice";
    try {
      const students = await api("/api/students", { force: true });
      renderApprovedStudents(students);
      approvedNotice.textContent = "Approved students refreshed.";
      approvedNotice.className = "form-notice success";
    } catch (error) {
      approvedNotice.textContent = error.message;
      approvedNotice.className = "form-notice error";
    } finally {
      button.disabled = false;
    }
  }

  async function refreshApprovals() {
    try {
      const [registrationRequests, browserRequests] = await Promise.all([
        api("/api/registration-requests", { force: true }),
        api("/api/browser-requests", { force: true }),
      ]);
      renderApprovals(registrationRequests, browserRequests);
    } catch (error) {
      approvalHost.innerHTML = msg(error.message, "error");
    }
  }

  function bindBrowserActions() {
    const selections = [
      ...approvalHost.querySelectorAll("[data-browser-select]"),
    ];
    const bulkButton = approvalHost.querySelector(
      "[data-bulk-browser-approve]",
    );
    const updateBulkSelection = () => {
      const count = selections.filter((item) => item.checked).length;
      const countHost = approvalHost.querySelector(
        "[data-browser-selected-count]",
      );
      if (countHost) countHost.textContent = count;
      if (bulkButton) bulkButton.disabled = !count;
    };
    selections.forEach((item) => (item.onchange = updateBulkSelection));
    if (bulkButton)
      bulkButton.onclick = async () => {
        const requestIds = selections
          .filter((item) => item.checked)
          .map((item) => item.value);
        if (!requestIds.length) return;
        bulkButton.disabled = true;
        approvalNotice.textContent = "Approving selected browsers…";
        try {
          const outcome = await api("/api/browser-requests/bulk-approve", {
            method: "POST",
            body: JSON.stringify({ request_ids: requestIds }),
          });
          await Promise.all([refreshApprovals(), refreshApprovedStudents()]);
          approvalNotice.textContent = `${outcome.approved} browser${outcome.approved === 1 ? "" : "s"} approved${outcome.failed.length ? `; ${outcome.failed.length} could not be approved` : ""}.`;
          approvalNotice.className = outcome.failed.length
            ? "form-notice warning"
            : "form-notice success";
        } catch (error) {
          approvalNotice.textContent = error.message;
          approvalNotice.className = "form-notice error";
          bulkButton.disabled = false;
        }
      };
    approvalHost
      .querySelectorAll("[data-browser-approve]")
      .forEach((button) => {
        button.onclick = async () => {
          button.disabled = true;
          approvalNotice.textContent = "Approving browser…";
          try {
            await api(
              `/api/browser-requests/${button.dataset.browserApprove}/approve`,
              { method: "POST" },
            );
            await Promise.all([refreshApprovals(), refreshApprovedStudents()]);
            approvalNotice.textContent = "Browser approved.";
            approvalNotice.className = "form-notice success";
          } catch (error) {
            approvalNotice.textContent = error.message;
            approvalNotice.className = "form-notice error";
            button.disabled = false;
          }
        };
      });
    approvalHost.querySelectorAll("[data-browser-reject]").forEach((button) => {
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
        button.disabled = true;
        try {
          await api(
            `/api/browser-requests/${button.dataset.browserReject}/reject`,
            { method: "POST" },
          );
          await refreshApprovals();
          approvalNotice.textContent = "Browser request rejected.";
          approvalNotice.className = "form-notice success";
        } catch (error) {
          approvalNotice.textContent = error.message;
          approvalNotice.className = "form-notice error";
          button.disabled = false;
        }
      };
    });
  }

  document.querySelector("#refresh-approved-students").onclick =
    refreshApprovedStudents;
  document.querySelector("#add-student").onclick = () =>
    studentForm(refreshApprovedStudents);
  search.oninput = applyStudentSearch;
  document.querySelector("#registration-qr").onclick = async () => {
    const button = document.querySelector("#registration-qr");
    const output = document.querySelector("#registration-qr-output");
    button.disabled = true;
    output.innerHTML = '<div class="skeleton-card">Generating QR…</div>';
    try {
      const registration = await api("/api/registration-qr", {
        method: "POST",
      });
      const url = buildStudentUrl(location.origin, {
        registration_token: registration.token,
      });
      const qr = await QRCode.toDataURL(url, { width: 240 });
      output.innerHTML = `<article class="qr-card"><h3>Registration QR · valid for 24 hours</h3><img src="${qr}" alt="Registration QR"><p>${esc(url)}</p></article>`;
    } catch (error) {
      output.innerHTML = msg(error.message, "error");
    } finally {
      button.disabled = false;
    }
  };

  try {
    const overview = await api("/api/students/overview");
    renderApprovals(overview.registration_requests, overview.browser_requests);
    renderApprovedStudents(overview.students);
  } catch (error) {
    approvalHost.innerHTML = msg(error.message, "error");
    approvedHost.innerHTML = msg(error.message, "error");
  }
}
