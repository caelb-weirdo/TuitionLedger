import QRCode from "qrcode";
import "./style.css";
import "./logo.css";
import "./auth-submit-fix.js";

const app = document.querySelector("#app"),
  localHost =
    location.hostname === "localhost" || location.hostname === "127.0.0.1",
  apiUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (localHost
      ? "http://localhost:8000"
      : "https://tuitionledger-backend.vercel.app"),
  studentUrl =
    import.meta.env.VITE_STUDENT_APP_URL ||
    (localHost
      ? "http://localhost:5174"
      : "https://student-mobile-pwa.vercel.app");
const logo = '<img src="/icon.svg" alt="">TuitionLedger',
  subjects = ["Maths", "Science", "English", "Tamil", "History"],
  days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
const auth = () => {
    try {
      return JSON.parse(
        sessionStorage.getItem("tuitionledger:tutor") || "null",
      );
    } catch {
      return null;
    }
  },
  token = () => auth()?.access_token;
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const r = await fetch(`${apiUrl}${path}`, { ...options, headers }),
    b = await r.json().catch(() => ({}));
  if (!r.ok || b.success === false)
    throw Error(b.message || "That action could not be completed.");
  return b.data;
}
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
const msg = (t, k = "") => `<p class="inline-notice ${k}">${esc(t)}</p>`;

function landing() {
  app.innerHTML = `<header class="site-header"><a class="logo" href="#top">${logo}</a><nav><a href="#features">Features</a><a href="#flow">How it works</a><a href="#signup">Create account</a><a class="button button-small" href="#login">Tutor login</a></nav></header><main><section class="hero"><div><p class="kicker">TuitionLedger / tutor workspace</p><h1>A clearer register for every class.</h1><p class="hero-text">Manage Grade 10 and Grade 11 students, browser-approved attendance, monthly fees, and parent reminders from one calm workspace.</p><div class="hero-actions"><a class="button" href="#signup">Create tutor account</a><a class="button button-ghost" href="#flow">See the flow</a></div></div><div class="mockups"><div class="laptop"><div class="screen"><div class="mini-top"><strong>TuitionLedger</strong><span>Dashboard</span></div><div class="mini-grid"><div><b>Students</b><small>Approved records</small></div><div><b>Classes</b><small>Grade 10 / 11</small></div><div><b>Attendance</b><small>Live QR session</small></div><div><b>Fees</b><small>Monthly ledger</small></div></div><div class="mini-chart"><span></span><span></span><span></span><span></span><span></span></div></div></div><div class="phone"><div class="phone-speaker"></div><div class="phone-screen"><p class="mini-label">STUDENT PWA</p><h3>Browser approved</h3><div class="check">✓</div><p>Ready to mark attendance.</p><span class="status-pill">STU001 · Ready</span></div></div></div></section><section id="features" class="section"><div class="section-heading"><p class="kicker">The useful core</p><h2>Four things your next class needs.</h2></div><div class="feature-grid"><article class="feature-card"><h3>Student registration</h3><p>Share one QR link and review every request.</p></article><article class="feature-card"><h3>Trusted attendance</h3><p>Only an approved browser can mark present.</p></article><article class="feature-card"><h3>Class register</h3><p>Keep schedules, enrolments, and fees together.</p></article><article class="feature-card"><h3>Parent reminders</h3><p>Open a prepared WhatsApp message in one click.</p></article></div></section><section id="flow" class="section"><div class="section-heading"><p class="kicker">One simple sequence</p><h2>Registration to attendance.</h2></div><div class="flow"><div><span>01</span><h3>Create a class</h3><p>Set grade, subject, schedule, and fee.</p></div><div><span>02</span><h3>Share the QR</h3><p>Students register from the PWA.</p></div><div><span>03</span><h3>Approve the browser</h3><p>Review details and create a student ID.</p></div><div><span>04</span><h3>Open attendance</h3><p>Show a short-lived room QR.</p></div></div></section><section class="final-cta"><p class="kicker">Ready for the next class?</p><h2>Start with a real tutor account.</h2><a class="button" href="#signup">Create account</a></section></main><footer><span class="logo">${logo}</span><small>Simple tools for better tuition classes.</small></footer>`;
}
function passwordField() {
  return '<div class="password-wrap"><input name="password" type="password" minlength="8" required><button class="password-toggle" type="button" aria-label="Show password"><span aria-hidden="true">&#128065;</span></button></div>';
}
function authPage(signup = false) {
  const endpoint = signup ? "signup" : "login";
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><a class="logo" href="#top">${logo}</a><p class="kicker">Tutor portal</p><h1>${signup ? "Create your account." : "Welcome back."}</h1><p class="muted">${signup ? "Create a tutor login, then confirm your email if requested." : "Sign in to manage students, classes, attendance, and fees."}</p><form id="auth-form" class="auth-form"><label>Email<input name="email" type="email" required></label><label>Password${passwordField()}</label><p id="auth-notice" class="form-notice"></p><button class="button">${signup ? "Create tutor account" : "Sign in"}</button></form><p class="auth-switch">${signup ? "Already registered?" : "New tutor?"} <a href="#${signup ? "login" : "signup"}">${signup ? "Sign in" : "Create an account"}</a></p><a class="back-link" href="#top">Back to landing page</a></section></main>`;
  document.querySelector(".password-toggle").onclick = () => {
    const input = document.querySelector("[name=password]");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    const b = document.querySelector(".password-toggle");
    b.setAttribute("aria-label", visible ? "Show password" : "Hide password");
  };
  document.querySelector("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const n = document.querySelector("#auth-notice");
    try {
      const r = await api(`/api/auth/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (signup) {
        n.textContent = "Account created. Check your email, then sign in.";
        setTimeout(() => (location.hash = "#login"), 1000);
      } else {
        sessionStorage.setItem("tuitionledger:tutor", JSON.stringify(r));
        location.hash = "#dashboard";
      }
    } catch (x) {
      n.textContent = x.message;
    }
  };
}
function shell(page, title, body) {
  const nav = [
    ["dashboard", "Dashboard"],
    ["students", "Students"],
    ["classes", "Classes"],
    ["attendance", "Attendance"],
    ["fees", "Fees"],
    ["settings", "Settings"],
  ]
    .map(
      ([id, l]) =>
        `<a class="${page === id ? "active" : ""}" href="#${id}">${l}</a>`,
    )
    .join("");
  app.innerHTML = `<div class="app-shell"><aside><a class="logo" href="#dashboard">${logo}</a><p class="side-label">Tutor workspace</p><nav>${nav}</nav><button id="sign-out" class="side-signout">Sign out</button></aside><main class="workspace"><header class="workspace-header"><div><p class="kicker">TuitionLedger / ${page}</p><h1>${title}</h1></div></header>${body}</main></div>`;
  document.querySelector("#sign-out").onclick = () => {
    sessionStorage.removeItem("tuitionledger:tutor");
    location.hash = "#login";
  };
}
async function dashboard() {
  shell(
    "dashboard",
    "Dashboard",
    `<section class="page-intro"><p class="kicker">Today at a glance</p><h2>Keep every class moving.</h2><p class="muted">Review a request, open attendance, or update a fee.</p></section><div class="dashboard-bento"><div id="stats" class="dashboard-grid">${["Approved students", "Active classes", "Pending requests", "Unpaid fees"].map((x) => `<article class="summary-card"><small>${x}</small><strong>—</strong></article>`).join("")}</div><section class="panel"><h2>Choose a workspace section</h2><p class="muted">Students, Classes, Attendance, Fees, and Settings are ready from the left navigation.</p></section></div>`,
  );
  try {
    const [s, c, r, f] = await Promise.all([
      api("/api/students"),
      api("/api/classes"),
      api("/api/registration-requests"),
      api("/api/fees"),
    ]);
    [
      s.length,
      c.length,
      r.filter((x) => x.status === "Pending").length,
      f.filter((x) => x.status === "Unpaid").length,
    ].forEach(
      (v, i) => (document.querySelectorAll("#stats strong")[i].textContent = v),
    );
  } catch (e) {
    document
      .querySelector("#stats")
      ?.insertAdjacentHTML("afterend", msg(e.message, "error"));
  }
}
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
async function studentsPage() {
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
async function classesPage() {
  shell(
    "classes",
    "Classes",
    `<section class="page-intro"><p class="kicker">Class register</p><h2>Build the week around your subjects.</h2></section><article class="form-card"><h3>Create class</h3><form id="class-form" class="grid-form"><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><label>Subject<select name="subject">${subjects.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Class name<input name="class_name" required></label><label>Day<select name="day">${days.map((x, i) => `<option value="${i}">${x}</option>`).join("")}</select></label><label>Start time<input type="time" name="start_time" required></label><label>End time<input type="time" name="end_time" required></label><label>Monthly fee<input type="number" name="monthly_fee" min="0" required></label><button class="button">Save class</button></form></article><section id="class-list" class="list-grid">Loading classes...</section>`,
  );
  let editingClass = null;
  document.querySelector("#class-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(
        editingClass ? `/api/classes/${editingClass.id}` : "/api/classes",
        {
          method: editingClass ? "PUT" : "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        },
      );
      editingClass = null;
      classesPage();
    } catch (x) {
      e.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(x.message, "error"),
      );
    }
  };
  try {
    const list = await api("/api/classes"),
      host = document.querySelector("#class-list");
    host.innerHTML =
      list
        .map(
          (x) =>
            `<article class="record-card"><span class="status-pill">${esc(x.grade)} · ${esc(x.subject)}</span><h3>${esc(x.class_name)}</h3><p>${days[x.day]} · ${esc(x.start_time)} – ${esc(x.end_time)}</p><strong>Rs. ${esc(x.monthly_fee)}</strong><button class="button button-small danger" data-delete="${x.id}">Delete</button></article>`,
        )
        .join("") ||
      `<article class="record-card"><h3>No classes yet</h3><p>Create Grade 11 Maths or Grade 10 Science to begin.</p></article>`;
    host.querySelectorAll("[data-delete]").forEach((deleteButton) => {
      const editButton = document.createElement("button");
      editButton.className = "button button-small button-ghost";
      editButton.textContent = "Edit";
      editButton.type = "button";
      deleteButton.parentElement.insertBefore(editButton, deleteButton);
      editButton.onclick = () => {
        editingClass = list.find(
          (item) => item.id === deleteButton.dataset.delete,
        );
        const form = document.querySelector("#class-form");
        Object.entries(editingClass || {}).forEach(([key, value]) => {
          const field = form.elements.namedItem(key);
          if (field && value != null) field.value = value;
        });
        form.querySelector("button").textContent = "Update class";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    });
    host.querySelectorAll("[data-delete]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (confirm("Delete this class?")) {
            await api(`/api/classes/${b.dataset.delete}`, { method: "DELETE" });
            classesPage();
          }
        }),
    );
  } catch (e) {
    document.querySelector("#class-list").innerHTML = msg(e.message, "error");
  }
}
async function attendancePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><p class="kicker">Live attendance</p><h2>Open a short-lived room QR.</h2></section><article class="form-card"><form id="attendance-form" class="grid-form"><label>Class<select name="class_id" id="attendance-class"></select></label><label>Duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button">Open attendance QR</button></form></article><section id="attendance-result" class="panel">Select a class to begin.</section>`,
  );
  try {
    const list = await api("/api/classes");
    document.querySelector("#attendance-class").innerHTML = list
      .map(
        (x) =>
          `<option value="${x.id}">${esc(x.grade)} · ${esc(x.subject)} · ${esc(x.class_name)}</option>`,
      )
      .join("");
  } catch (e) {
    document.querySelector("#attendance-result").innerHTML = msg(
      e.message,
      "error",
    );
  }
  document.querySelector("#attendance-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const x = await api("/api/attendance-sessions", {
          method: "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        }),
        url = `${studentUrl}/?attendance_token=${encodeURIComponent(x.qr_token)}`,
        qr = await QRCode.toDataURL(url, { width: 260 });
      document.querySelector("#attendance-result").innerHTML =
        `<div class="qr-card"><span class="status-pill">Active for ${x.duration_minutes} minutes</span><h3>Show this QR to enrolled students</h3><img src="${qr}" alt="Attendance QR"><p>${esc(url)}</p><button id="end-session" class="button">End session</button></div>`;
      document.querySelector("#end-session").onclick = async () => {
        await api(`/api/attendance-sessions/${x.id}/end`, { method: "POST" });
        document.querySelector("#attendance-result").innerHTML = msg(
          "Attendance session ended.",
          "success",
        );
      };
    } catch (x) {
      document.querySelector("#attendance-result").innerHTML = msg(
        x.message,
        "error",
      );
    }
  };
}
async function feesPage() {
  shell(
    "fees",
    "Fees",
    `<section class="page-intro"><p class="kicker">Monthly ledger</p><h2>Mark paid and remind clearly.</h2><p class="muted">Generate a month after enrolling students to create the fee rows.</p></section><article class="form-card"><form id="fee-form" class="inline-form"><label>Month<input type="month" name="month" required></label><button class="button">Generate fee rows</button></form><p id="fee-notice" class="form-notice" aria-live="polite"></p></article><section id="fee-list" class="list-grid" aria-live="polite">Loading fee records…</section>`,
  );
  document.querySelector("#fee-form").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector("button");
    const notice = document.querySelector("#fee-notice");
    button.disabled = true;
    button.textContent = "Generating…";
    notice.textContent = "Creating fee rows for the selected month.";
    try {
      await api("/api/fees/generate", {
        method: "POST",
        body: JSON.stringify({ month: `${e.currentTarget.month.value}-01` }),
      });
      feesPage();
    } catch (x) {
      button.disabled = false;
      button.textContent = "Generate fee rows";
      notice.textContent = x.message;
      notice.className = "form-notice error";
      e.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(x.message, "error"),
      );
    }
  };
  try {
    const list = await api("/api/fees"),
      host = document.querySelector("#fee-list");
    host.innerHTML =
      list
        .map(
          (x) =>
            `<article class="record-card"><span class="status-pill">${esc(x.status)}</span><h3>${esc(x.full_name)}</h3><p>${esc(x.class_name)} · ${esc(x.month)}</p><strong>Rs. ${esc(x.amount)}</strong><div class="card-actions"><button class="button button-small" data-paid="${x.id}">${x.status === "Paid" ? "Mark unpaid" : "Mark paid"}</button>${x.status === "Unpaid" ? `<button class="button button-small button-ghost" data-wa="${x.id}">WhatsApp reminder</button>` : ""}</div></article>`,
        )
        .join("") ||
      `<article class="record-card"><h3>No fee rows yet</h3><p>Enroll at least one approved student in a class, then generate a month.</p></article>`;
    host.querySelectorAll("[data-paid]").forEach(
      (b) =>
        (b.onclick = async () => {
          const x = list.find((v) => v.id === b.dataset.paid);
          const previous = b.textContent;
          b.disabled = true;
          b.textContent = "Saving…";
          try {
            await api(`/api/fees/${b.dataset.paid}`, {
              method: "PUT",
              body: JSON.stringify({
                status: x.status === "Paid" ? "Unpaid" : "Paid",
              }),
            });
            feesPage();
          } catch (e) {
            b.disabled = false;
            b.textContent = previous;
            host.insertAdjacentHTML("afterbegin", msg(e.message, "error"));
          }
        }),
    );
    host.querySelectorAll("[data-wa]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const x = await api(`/api/fees/${b.dataset.wa}/whatsapp`);
            window.open(x.url, "_blank", "noopener");
          } catch (e) {
            host.insertAdjacentHTML("afterbegin", msg(e.message, "error"));
          }
        }),
    );
  } catch (e) {
    document.querySelector("#fee-list").innerHTML = msg(e.message, "error");
  }
}
function settingsPage() {
  shell(
    "settings",
    "Settings",
    `<section class="page-intro"><p class="kicker">Workspace settings</p><h2>Keep your tutor profile current.</h2></section><article class="form-card"><form id="settings-form" class="grid-form"><label>Full name<input name="full_name" required></label><label>Phone<input name="phone"></label><label>Centre name<input name="center_name"></label><button class="button">Save settings</button></form><p id="settings-notice"></p></article>`,
  );
  api("/api/tutor")
    .then((x) =>
      ["full_name", "phone", "center_name"].forEach(
        (k) => (document.querySelector(`[name=${k}]`).value = x[k] || ""),
      ),
    )
    .catch(() => {});
  document.querySelector("#settings-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/tutor", {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      document.querySelector("#settings-notice").textContent =
        "Settings saved.";
    } catch (x) {
      document.querySelector("#settings-notice").textContent = x.message;
    }
  };
}
async function attendanceWorkspacePage() {
  shell(
    "attendance",
    "Attendance",
    `<section class="page-intro"><p class="kicker">Attendance register</p><h2>Choose a class, then record the room.</h2><p class="muted">Use the QR for normal student scanning, or mark a student manually when their phone cannot scan.</p></section><article class="form-card"><form id="attendance-form" class="grid-form"><label>Class<select name="class_id" id="attendance-class" required disabled><option value="">Loading classes…</option></select></label><label>Date<input type="date" name="attendance_date" id="attendance-date" required></label><label>QR duration<select name="duration_minutes"><option value="5">5 minutes</option><option value="10">10 minutes</option></select></label><button class="button" disabled>Loading classes…</button></form><p id="attendance-notice" class="form-notice" aria-live="polite"></p></article><section class="attendance-layout"><article class="panel"><div class="section-heading"><p class="kicker">Enrolled students</p><h3 id="roster-title">Select a class</h3></div><div id="attendance-roster" class="attendance-roster"><p class="muted">Loading your classes…</p></div></article><article id="attendance-result" class="panel"><p class="muted">The QR will appear here after you generate a session.</p></article></section>`,
  );
  const dateInput = document.querySelector("#attendance-date");
  const classSelect = document.querySelector("#attendance-class");
  const attendanceForm = document.querySelector("#attendance-form");
  const attendanceNotice = document.querySelector("#attendance-notice");
  dateInput.value = new Date().toISOString().slice(0, 10);
  let currentSession = null;
  let enrolled = [];
  let records = [];
  const roster = document.querySelector("#attendance-roster");
  const statusFor = (studentId) =>
    records.find((x) => x.student_id === studentId)?.status || "Not marked";
  const renderRoster = () => {
    document.querySelector("#roster-title").textContent =
      `${enrolled.length} enrolled student${enrolled.length === 1 ? "" : "s"}`;
    roster.innerHTML =
      enrolled
        .map(
          (s) =>
            `<div class="attendance-row"><div><strong>${esc(s.full_name)}</strong><small>${esc(s.student_code)} · ${esc(s.student_phone)}</small></div><span class="attendance-status ${statusFor(s.id).toLowerCase().replace(" ", "-")}">${esc(statusFor(s.id))}</span><div class="attendance-actions"><button class="button button-small" data-manual="Present" data-student="${s.id}" ${currentSession ? "" : "disabled"}>Present</button><button class="button button-small button-ghost" data-manual="Absent" data-student="${s.id}" ${currentSession ? "" : "disabled"}>Absent</button></div></div>`,
        )
        .join("") ||
      `<p class="muted">No students are enrolled in this class yet.</p>`;
    roster.querySelectorAll("[data-manual]").forEach(
      (button) =>
        (button.onclick = async () => {
          try {
            await api("/api/attendance/manual", {
              method: "POST",
              body: JSON.stringify({
                session_id: currentSession.id,
                class_id: currentSession.class_id,
                student_id: button.dataset.student,
                status: button.dataset.manual,
              }),
            });
            await loadRecords();
          } catch (error) {
            roster.insertAdjacentHTML(
              "afterbegin",
              msg(error.message, "error"),
            );
          }
        }),
    );
  };
  const loadRecords = async () => {
    if (!document.querySelector("#attendance-class").value) return;
    records = await api(
      `/api/attendance/classes/${document.querySelector("#attendance-class").value}`,
    );
    records = records.filter((x) => x.attendance_date === dateInput.value);
    renderRoster();
  };
  try {
    const list = await api("/api/classes");
    if (!Array.isArray(list)) throw Error("Classes could not be loaded. Refresh and try again.");
    classSelect.innerHTML = list.length
      ? list
      .map(
        (x) =>
          `<option value="${x.id}">${esc(x.grade)} · ${esc(x.subject)} · ${esc(x.class_name)}</option>`,
      )
      .join("")
      : '<option value="">No classes available</option>';
    classSelect.disabled = !list.length;
    attendanceForm.querySelector("button").disabled = !list.length;
    attendanceForm.querySelector("button").textContent = "Generate attendance QR";
    attendanceNotice.textContent = list.length
      ? `${list.length} class${list.length === 1 ? "" : "es"} loaded.`
      : "Create a class first, then return here to open attendance.";
    const loadRoster = async () => {
      const classId = document.querySelector("#attendance-class").value;
      if (!classId) return;
      currentSession = null;
      document.querySelector("#attendance-result").innerHTML =
        '<p class="muted">Generate a session to enable manual attendance.</p>';
      enrolled = await api(`/api/classes/${classId}/students`);
      records = [];
      try {
        await loadRecords();
      } catch {}
      renderRoster();
    };
    document.querySelector("#attendance-class").onchange = loadRoster;
    dateInput.onchange = async () => {
      currentSession = null;
      document.querySelector("#attendance-result").innerHTML =
        '<p class="muted">Generate a session for this date to enable manual attendance.</p>';
      await loadRecords();
    };
    await loadRoster();
  } catch (error) {
    classSelect.innerHTML = '<option value="">Unable to load classes</option>';
    classSelect.disabled = true;
    attendanceForm.querySelector("button").disabled = true;
    attendanceNotice.textContent = error.message;
    attendanceNotice.className = "form-notice error";
    roster.innerHTML = msg(error.message, "error");
  }
  document.querySelector("#attendance-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const session = await api("/api/attendance-sessions", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      currentSession = session;
      const url = `${studentUrl}/?attendance_token=${encodeURIComponent(session.qr_token)}`,
        qr = await QRCode.toDataURL(url, { width: 260 });
      document.querySelector("#attendance-result").innerHTML =
        `<div class="qr-card"><span class="status-pill">${esc(session.attendance_date)} · Active for ${session.duration_minutes} minutes</span><h3>Show this QR to enrolled students</h3><img src="${qr}" alt="Attendance QR code"><p class="muted">Students scan this from their approved browser. You can use the manual buttons beside any enrolled student.</p><button id="end-session" class="button">End session</button></div>`;
      renderRoster();
      document.querySelector("#end-session").onclick = async () => {
        await api(`/api/attendance-sessions/${session.id}/end`, {
          method: "POST",
        });
        currentSession = null;
        document.querySelector("#attendance-result").innerHTML = msg(
          "Attendance session ended.",
          "success",
        );
        renderRoster();
      };
    } catch (error) {
      document.querySelector("#attendance-result").innerHTML = msg(
        error.message,
        "error",
      );
    }
  };
}

function render() {
  const p = (location.hash.slice(1) || "top").split("?")[0];
  if (p === "top") landing();
  else if (p === "login") authPage();
  else if (p === "signup") authPage(true);
  else if (!auth()) authPage();
  else
    (
      ({
        dashboard,
        students: studentsPage,
        classes: classesPage,
        attendance: attendanceWorkspacePage,
        fees: feesPage,
        settings: settingsPage,
      })[p] || dashboard
    )();
}
window.addEventListener("hashchange", render);
render();
