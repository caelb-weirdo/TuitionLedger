const localHost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

export const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (localHost
    ? "http://localhost:8000"
    : "https://tuitionledger-backend.vercel.app");
