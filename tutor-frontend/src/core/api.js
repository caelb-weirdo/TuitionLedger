import { apiUrl } from "./config.js";

const responseCache = new Map();
const FRESH_FOR = 60_000;
const KEEP_FOR = 300_000;

export const auth = () => {
  try {
    return JSON.parse(localStorage.getItem("tuitionledger:tutor") || "null");
  } catch {
    return null;
  }
};
export const token = () => auth()?.access_token;
export const storeAuth = (session) => {
  const expiresIn = Number(session?.expires_in || 3600);
  localStorage.setItem(
    "tuitionledger:tutor",
    JSON.stringify({ ...session, expires_at: Date.now() + expiresIn * 1000 }),
  );
};
export const clearAuth = () => localStorage.removeItem("tuitionledger:tutor");

async function refreshSession() {
  const session = auth();
  if (!session?.refresh_token) return false;
  const response = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.data?.access_token) return false;
  storeAuth(body.data);
  return true;
}

export async function api(path, options = {}, retried = false) {
  const method = (options.method || "GET").toUpperCase();
  const owner = auth()?.user?.id || "public";
  const cacheKey = `${owner}:${path}`;
  const cached = responseCache.get(cacheKey);
  if (method === "GET" && !options.force && !options.bypassCache && cached) {
    const age = Date.now() - cached.savedAt;
    if (age < FRESH_FOR) return cached.data;
    if (age < KEEP_FOR) {
      api(path, { ...options, bypassCache: true }).catch(() => {});
      return cached.data;
    }
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    throw Error(
      error.name === "AbortError"
        ? "The request timed out. Try again."
        : "We could not connect to the server.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
  if (
    response.status === 401 &&
    !retried &&
    token() &&
    (await refreshSession())
  ) {
    return api(path, options, true);
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401) {
    clearAuth();
    location.hash = "#login";
  }
  if (!response.ok || body?.success === false)
    throw Error(body?.message || "That action could not be completed.");
  if (method === "GET") {
    responseCache.set(cacheKey, { data: body.data, savedAt: Date.now() });
  } else {
    responseCache.clear();
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("tuitionledger:fees-ready:"))
      .forEach((key) => sessionStorage.removeItem(key));
  }
  return body.data;
}

export const clearApiCache = () => responseCache.clear();
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
