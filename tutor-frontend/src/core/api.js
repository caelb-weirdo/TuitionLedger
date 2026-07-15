import { apiUrl } from "./config.js";

export const auth = () => {
  try {
    return JSON.parse(sessionStorage.getItem("tuitionledger:tutor") || "null");
  } catch {
    return null;
  }
};
export const token = () => auth()?.access_token;
export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false)
    throw Error(body.message || "That action could not be completed.");
  return body.data;
}
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
export const msg = (text, kind = "") =>
  `<p class="inline-notice ${kind}">${esc(text)}</p>`;
