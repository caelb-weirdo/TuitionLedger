import { app, logo } from '../core/config.js';
export function shell(page, title, body) {
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
