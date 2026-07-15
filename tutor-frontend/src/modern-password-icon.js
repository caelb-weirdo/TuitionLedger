const eye = `<svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 12s3.4-6 9.8-6 9.8 6 9.8 6-3.4 6-9.8 6-9.8-6-9.8-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>`;
function ensurePasswordIcon() {
  const button = document.querySelector(".password-toggle"),
    input = document.querySelector(".password-wrap input");
  if (!button || !input) return;
  if (!button.querySelector(".password-icon")) button.innerHTML = eye;
  button.classList.add("modern-password-toggle");
}
function wirePasswordIcon() { ensurePasswordIcon(); }
const app = document.querySelector("#app");
if (app)
  new MutationObserver(wirePasswordIcon).observe(app, {
    childList: true,
    subtree: true,
  });
window.addEventListener("hashchange", wirePasswordIcon);
wirePasswordIcon();
