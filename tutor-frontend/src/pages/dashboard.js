import { api, msg } from '../core/api.js';
import { shell } from './layout.js';
export async function dashboard() {
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
