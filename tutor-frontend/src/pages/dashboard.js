import { api, esc, msg } from "../core/api.js";
import { days } from "../core/config.js";
import { shell } from "./layout.js";

export async function dashboard() {
  shell(
    "dashboard",
    "Dashboard",
    `<section class="page-intro"><p class="kicker">Today at a glance</p><h2>Keep every class moving.</h2><p class="muted">Overview only: open a workspace page when you need to make a change.</p></section><div class="dashboard-bento"><div id="stats" class="dashboard-grid">${["Total students", "Total classes", "Pending registrations", "Unpaid fees"].map((label) => `<article class="summary-card"><small>${label}</small><strong>—</strong></article>`).join("")}</div><section class="dashboard-overview"><article class="panel"><div class="section-heading"><p class="kicker">Schedule</p><h3>Today's classes</h3></div><div id="today-classes"><p class="muted">Loading schedule…</p></div></article><article class="panel"><div class="section-heading"><p class="kicker">Activity</p><h3>Recent activity</h3></div><div id="recent-activity"><p class="muted">Loading activity…</p></div></article></section></div>`,
  );
  try {
    const [students, classes, requests, fees] = await Promise.all([
      api("/api/students"),
      api("/api/classes"),
      api("/api/registration-requests"),
      api("/api/fees"),
    ]);
    [
      students.length,
      classes.length,
      requests.filter((item) => item.status === "Pending").length,
      fees.filter((item) => item.status === "Unpaid").length,
    ].forEach((value, index) => {
      document.querySelectorAll("#stats strong")[index].textContent = value;
    });
    const today = new Date().getDay();
    const todayClasses = classes.filter((item) => Number(item.day) === today);
    document.querySelector("#today-classes").innerHTML = todayClasses.length
      ? todayClasses.map((item) => `<a class="overview-row" href="#classes"><span><strong>${esc(item.class_name)}</strong><small>${esc(item.grade)} · ${esc(item.subject)}</small></span><time>${esc(item.start_time)}–${esc(item.end_time)}</time></a>`).join("")
      : `<p class="muted">No classes scheduled for ${days[today]}.</p>`;
    const recent = [
      ...requests.slice(0, 3).map((item) => ({
        label: `${item.full_name} registration`,
        detail: item.status,
        href: "#students",
      })),
      ...fees.filter((item) => item.status === "Unpaid").slice(0, 3).map((item) => ({
        label: `${item.full_name} fee`,
        detail: "Unpaid",
        href: "#fees",
      })),
    ].slice(0, 5);
    document.querySelector("#recent-activity").innerHTML = recent.length
      ? recent.map((item) => `<a class="overview-row" href="${item.href}"><strong>${esc(item.label)}</strong><span class="status-pill">${esc(item.detail)}</span></a>`).join("")
      : '<p class="muted">No recent registrations or unpaid fees.</p>';
  } catch (error) {
    document.querySelector("#stats")?.insertAdjacentHTML("afterend", msg(error.message, "error"));
  }
}
