import { apiUrl } from "./config.js";

export async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (error) {
    throw new Error(error.name === "AbortError" ? "The request timed out. Try again." : "We could not connect to the server. Check your connection and try again.");
  } finally {
    window.clearTimeout(timer);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    const error = new Error(body?.message || "Connection problem. Please try again.");
    error.status = response.status;
    error.data = body?.data;
    throw error;
  }
  return body.data;
}
