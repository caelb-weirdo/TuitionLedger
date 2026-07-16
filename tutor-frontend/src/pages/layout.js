import { clearAuth } from "../core/api.js";
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
        `<a class="${page === id ? "active" : ""}" href="#${id}">${l}</a>`,
    )
    .join("");
  app.innerHTML = `<div class="app-shell"><aside><a class="logo" href="#dashboard">${logo}</a><p class="side-label">Tutor PWA</p><nav>${nav}</nav><button id="install-app" class="side-signout" hidden>Install tutor app</button><button id="sign-out" class="side-signout">Sign out</button></aside><main class="workspace"><header class="workspace-header"><div><p class="kicker">TuitionLedger / ${page}</p><h1>${title}</h1></div></header>${body}</main></div>`;
  bindInstallButton();
  document.querySelector("#sign-out").onclick = () => {
    clearAuth();
    location.hash = "#login";
  };
}
