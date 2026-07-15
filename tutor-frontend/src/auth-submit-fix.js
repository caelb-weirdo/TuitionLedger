const localHost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const authApi =
  import.meta.env.VITE_API_BASE_URL ||
  (localHost
    ? "http://localhost:8000"
    : "https://tuitionledger-backend.vercel.app");
async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget,
    button = form.querySelector("button.button"),
    notice = form.querySelector("#auth-notice"),
    signup = location.hash.slice(1) === "signup";
  if (!button || !notice) return;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = signup ? "Creating account…" : "Signing in…";
  notice.className = "form-notice";
  notice.textContent = signup
    ? "Creating your tutor account…"
    : "Signing you in…";
  try {
    const response = await fetch(
      `${authApi}/api/auth/${signup ? "signup" : "login"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false)
      throw new Error(
        body.message || "Account request could not be completed.",
      );
    if (signup) {
      notice.className = "form-notice success";
      notice.textContent =
        "Account created successfully. Redirecting to sign in…";
      setTimeout(() => {
        location.hash = "#login";
      }, 900);
    } else {
      sessionStorage.setItem("tuitionledger:tutor", JSON.stringify(body.data));
      notice.className = "form-notice success";
      notice.textContent = "Signed in successfully.";
      setTimeout(() => {
        location.hash = "#dashboard";
      }, 250);
    }
  } catch (error) {
    notice.className = "form-notice error";
    notice.textContent = error.message;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = signup ? "Create tutor account" : "Sign in";
  }
}
function wireAuth() {
  const form = document.querySelector("#auth-form");
  if (form && !form.dataset.authFixWired) {
    form.onsubmit = submitAuth;
    form.dataset.authFixWired = "true";
  }
}
const app = document.querySelector("#app");
if (app)
  new MutationObserver(wireAuth).observe(app, {
    childList: true,
    subtree: true,
  });
wireAuth();
