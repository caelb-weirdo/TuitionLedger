import { app, logo } from "../core/config.js";
import { api } from "../core/api.js";
function passwordField() {
  return '<div class="password-wrap"><input name="password" type="password" minlength="8" required><button class="password-toggle" type="button" aria-label="Show password"><svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 12s3.4-6 9.8-6 9.8 6 9.8 6-3.4 6-9.8 6-9.8-6-9.8-6Z"/><circle cx="12" cy="12" r="2.7"/></svg></button></div>';
}
export function authPage(signup = false) {
  const endpoint = signup ? "signup" : "login";
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><a class="logo" href="#top">${logo}</a><p class="kicker">Tutor PWA</p><h1>${signup ? "Create your account." : "Welcome back."}</h1><p class="muted">${signup ? "Create a tutor login, then confirm your email if requested." : "Sign in to manage students, classes, attendance, and fees."}</p><form id="auth-form" class="auth-form"><label>Email<input name="email" type="email" required></label><label>Password${passwordField()}</label><p id="auth-notice" class="form-notice"></p><button class="button">${signup ? "Create tutor account" : "Sign in"}</button></form><p class="auth-switch">${signup ? "Already registered?" : "New tutor?"} <a href="#${signup ? "login" : "signup"}">${signup ? "Sign in" : "Create an account"}</a></p><a class="back-link" href="#top">Back to landing page</a></section></main>`;
  document.querySelector(".password-toggle").onclick = () => {
    const input = document.querySelector("[name=password]");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    const b = document.querySelector(".password-toggle");
    b.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    b.innerHTML = visible
      ? '<svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 12s3.4-6 9.8-6 9.8 6 9.8 6-3.4 6-9.8 6-9.8-6-9.8-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>'
      : '<svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.4 0 9.8 6 9.8 6a18.3 18.3 0 0 1-3 3.6"/><path d="M6.2 6.9C3.7 8.3 2.2 12 2.2 12s3.4 6 9.8 6c1.4 0 2.7-.3 3.8-.8"/><path d="M9.9 9.9a2.7 2.7 0 0 0 3.8 3.8"/></svg>';
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
