export const app = document.querySelector("#app");
const localHost =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
export const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (localHost
    ? "http://localhost:8000"
    : "https://tuitionledger-backend.vercel.app");
export const studentUrl =
  import.meta.env.VITE_STUDENT_APP_URL ||
  (localHost
    ? "http://localhost:5174"
    : "https://student-mobile-pwa.vercel.app");
export const logo = '<img src="/icon.svg" alt="">TuitionLedger';
export const subjects = ["Maths", "Science", "English", "Tamil", "History"];
export const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
