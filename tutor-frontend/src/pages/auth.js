import { app, logo } from "../core/config.js";
import { api, storeAuth } from "../core/api.js";

const eyeOpen =
  '<svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 12s3.4-6 9.8-6 9.8 6 9.8 6-3.4 6-9.8 6-9.8-6-9.8-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
const eyeClosed =
  '<svg class="password-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.4 0 9.8 6 9.8 6a18.3 18.3 0 0 1-3 3.6"/><path d="M6.2 6.9C3.7 8.3 2.2 12 2.2 12s3.4 6 9.8 6c1.4 0 2.7-.3 3.8-.8"/><path d="M9.9 9.9a2.7 2.7 0 0 0 3.8 3.8"/></svg>';

function emailField() {
  return '<label>Email<input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" aria-describedby="email-error" required><small id="email-error" class="field-error" data-error="email"></small></label>';
}

function passwordField(name, autocomplete, label) {
  return `<label>${label}<div class="password-wrap"><input name="${name}" type="password" minlength="8" autocomplete="${autocomplete}" aria-describedby="${name}-help ${name}-error" required><button class="password-toggle modern-password-toggle" type="button" data-password-toggle="${name}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">${eyeOpen}</button></div><small id="${name}-help" class="password-help">Use at least 8 characters.</small><small id="${name}-error" class="field-error" data-error="${name}"></small></label>`;
}

function pageContent(mode) {
  if (mode === "signup") {
    return {
      kicker: "Tutor workspace",
      title: "Create your account.",
      description: "Create a tutor login. Email confirmation may be required.",
      fields: `${emailField()}${passwordField("password", "new-password", "Password")}${passwordField("confirm_password", "new-password", "Confirm password")}`,
      submit: "Create tutor account",
      pending: "Creating account…",
      switcher: 'Already registered? <a href="#login">Sign in</a>',
    };
  }
  if (mode === "forgot") {
    return {
      kicker: "Account recovery",
      title: "Reset your password.",
      description: "Enter your tutor email and we will send a secure recovery link.",
      fields: emailField(),
      submit: "Send recovery link",
      pending: "Sending recovery link…",
      switcher: '<a href="#login">Back to sign in</a>',
    };
  }
  if (mode === "reset") {
    return {
      kicker: "Account recovery",
      title: "Choose a new password.",
      description: "Use a new password with at least 8 characters.",
      fields: `${passwordField("password", "new-password", "New password")}${passwordField("confirm_password", "new-password", "Confirm password")}`,
      submit: "Update password",
      pending: "Updating password…",
      switcher: '<a href="#login">Back to sign in</a>',
    };
  }
  return {
    kicker: "Tutor workspace",
    title: "Welcome back.",
    description: "Sign in to manage students, classes, attendance, and fees.",
    fields: `${emailField()}${passwordField("password", "current-password", "Password")}<a class="forgot-password-link" href="#forgot-password">Forgot password?</a>`,
    submit: "Sign in",
    pending: "Signing in…",
    switcher: 'New tutor? <a href="#signup">Create an account</a>',
  };
}

function clearValidation(form, notice) {
  notice.textContent = "";
  notice.className = "form-notice";
  form.querySelectorAll(".field-error").forEach((item) => {
    item.textContent = "";
  });
  form.querySelectorAll("input").forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
}

function setFieldError(form, field, text) {
  form.querySelector(`[data-error="${field.name}"]`).textContent = text;
  field.setAttribute("aria-invalid", "true");
  field.focus();
}

function validationMessage(field) {
  if (field.validity.valueMissing) {
    const labels = {
      email: "Email",
      password: "Password",
      confirm_password: "Confirm password",
    };
    return `${labels[field.name] || "This field"} is required.`;
  }
  if (field.name === "email") return "Enter a valid email address.";
  return "Password must contain at least 8 characters.";
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.onclick = () => {
      const input = document.querySelector(
        `[name="${button.dataset.passwordToggle}"]`,
      );
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.setAttribute("aria-pressed", String(!showing));
      button.setAttribute(
        "aria-label",
        `${showing ? "Show" : "Hide"} ${button.dataset.passwordToggle === "confirm_password" ? "confirm password" : "password"}`,
      );
      button.innerHTML = showing ? eyeOpen : eyeClosed;
    };
  });
}

export function authPage(mode = "login") {
  const content = pageContent(mode);
  app.innerHTML = `<main class="auth-shell"><section class="auth-card"><a class="logo" href="#top">${logo}</a><p class="kicker">${content.kicker}</p><h1>${content.title}</h1><p class="muted">${content.description}</p><form id="auth-form" class="auth-form" novalidate>${content.fields}<p id="auth-notice" class="form-notice" role="status" aria-live="polite"></p><button class="button">${content.submit}</button></form><p class="auth-switch">${content.switcher}</p><a class="back-link" href="#top">Back to landing page</a></section></main>`;
  bindPasswordToggles();
  const form = document.querySelector("#auth-form");
  const notice = document.querySelector("#auth-notice");
  const recoveryError = sessionStorage.getItem("tuitionledger:recovery-error");
  if (mode === "forgot" && recoveryError) {
    notice.textContent = recoveryError;
    notice.className = "form-notice error";
    sessionStorage.removeItem("tuitionledger:recovery-error");
  }
  if (mode === "reset" && !sessionStorage.getItem("tuitionledger:recovery-token")) {
    notice.textContent = "That recovery link is missing or expired. Request a new one.";
    notice.className = "form-notice error";
    form.querySelector(".button").disabled = true;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    clearValidation(form, notice);
    const invalid = [...form.elements].find(
      (field) => field.matches?.("input") && !field.checkValidity(),
    );
    if (invalid) {
      setFieldError(form, invalid, validationMessage(invalid));
      return;
    }
    if (
      form.elements.confirm_password &&
      form.elements.confirm_password.value !== form.elements.password.value
    ) {
      setFieldError(
        form,
        form.elements.confirm_password,
        "Passwords do not match.",
      );
      return;
    }

    const submit = event.submitter || form.querySelector("button");
    submit.disabled = true;
    submit.textContent = content.pending;
    try {
      if (mode === "forgot") {
        await api("/api/auth/request-password-reset", {
          method: "POST",
          body: JSON.stringify({ email: form.elements.email.value.trim() }),
        });
        notice.textContent =
          "If that email is registered, a recovery link has been sent.";
        notice.className = "form-notice success";
        form.reset();
      } else if (mode === "reset") {
        await api("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            token: sessionStorage.getItem("tuitionledger:recovery-token"),
            password: form.elements.password.value,
          }),
        });
        sessionStorage.removeItem("tuitionledger:recovery-token");
        notice.innerHTML =
          'Password updated. <a href="#login">Sign in with your new password.</a>';
        notice.className = "form-notice success";
        form.reset();
        submit.hidden = true;
      } else {
        const endpoint = mode === "signup" ? "signup" : "login";
        const result = await api(`/api/auth/${endpoint}`, {
          method: "POST",
          body: JSON.stringify({
            email: form.elements.email.value.trim(),
            password: form.elements.password.value,
          }),
        });
        if (mode === "signup") {
          if (result?.access_token) {
            storeAuth(result);
            location.hash = "#dashboard";
            return;
          }
          notice.innerHTML =
            'Account created. Check your email if confirmation is required, then <a href="#login">sign in</a>.';
          notice.className = "form-notice success";
          form.reset();
          submit.hidden = true;
        } else {
          storeAuth(result);
          location.hash = "#dashboard";
        }
      }
    } catch (error) {
      notice.textContent = error.message;
      notice.className = "form-notice error";
    } finally {
      submit.disabled = false;
      if (!submit.hidden) submit.textContent = content.submit;
    }
  };
}
