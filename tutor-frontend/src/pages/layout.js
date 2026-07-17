import { api, clearAuth } from "../core/api.js";
import { app, logo } from "../core/config.js";
import { bindInstallButton } from "../pwa.js";
export function shell(page, title, body) {
  const nav = [
    ["dashboard", "Dashboard"],
    ["students", "Students"],
    ["classes", "Classes"],
    ["attendance", "Attendance"],
    ["fees", "Fees"],
  ]
    .map(
      ([id, l]) =>
        `<a class="${page === id ? "active" : ""}" href="#${id}" ${page === id ? 'aria-current="page"' : ""}><span>${l}</span>${id === "students" ? '<b class="nav-badge" data-pending-badge hidden></b>' : ""}</a>`,
    )
    .join("");
  app.innerHTML = `<div class="app-shell"><aside><a class="logo" href="#dashboard">${logo}</a><p class="side-label">Tutor workspace</p><nav aria-label="Main navigation">${nav}</nav><button id="install-app" class="side-signout" hidden>Install tutor app</button><button id="sign-out" class="side-signout">Sign out</button></aside><main class="workspace"><header class="workspace-header"><div><p class="kicker">TuitionLedger / ${page}</p><h1>${title}</h1></div></header>${body}</main><nav class="mobile-navigation" aria-label="Mobile navigation">${nav}</nav></div>`;
  bindInstallButton();
  document.querySelector("#sign-out").onclick = () => {
    clearAuth();
    location.hash = "#login";
  };
  api("/api/registration-requests")
    .then((requests) => {
      const count = requests.filter((item) => item.status === "Pending").length;
      document.querySelectorAll("[data-pending-badge]").forEach((badge) => {
        badge.textContent = count;
        badge.hidden = !count;
        badge.setAttribute("aria-label", `${count} pending registrations`);
      });
    })
    .catch(() => {});
}
