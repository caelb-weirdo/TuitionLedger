import { api } from "../core/api.js";
import { app } from "../core/config.js";
import { shell } from "./layout.js";
export function settingsPage() {
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
