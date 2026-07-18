export function buildStudentUrl(origin, parameters = {}) {
  const url = new URL("/", origin);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}
