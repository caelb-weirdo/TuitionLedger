import "./app.css";
import { auth } from "./core/api.js";
import { landing } from "./pages/landing.js";
import { authPage } from "./pages/auth.js";
import { dashboard } from "./pages/dashboard.js";
import { studentsPage } from "./pages/students.js";
import { studentDetailPage } from "./pages/student-detail.js";
import { registrationRequestPage } from "./pages/registration-request.js";
import { classesPage } from "./pages/classes.js";
import { qrSessionPage } from "./pages/qr-session.js";
import { attendanceWorkspacePage } from "./pages/attendance.js";
import { feesPage } from "./pages/fees.js";
import { registerTutorPwa } from "./pwa.js";

const landingSections = new Set(["features", "flow", "preview", "faq"]);

function showLandingSection(section) {
  landing();
  window.requestAnimationFrame(() => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  });
}

function render() {
  if (window.__studentsRefreshTimer) {
    window.clearInterval(window.__studentsRefreshTimer);
    window.__studentsRefreshTimer = null;
  }
  const page = (location.hash.slice(1) || "top").split("?")[0];
  if (page === "top") landing();
  else if (landingSections.has(page)) showLandingSection(page);
  else if (page === "login") authPage();
  else if (page === "signup") authPage(true);
  else if (!auth()) authPage();
  else
    (
      ({
        dashboard,
        students: studentsPage,
        student: studentDetailPage,
        "registration-request": registrationRequestPage,
        classes: classesPage,
        "qr-session": qrSessionPage,
        attendance: attendanceWorkspacePage,
        fees: feesPage,
      })[page] || dashboard
    )();
}

window.addEventListener("error", (event) => {
  console.error("Application error:", event.error || event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
const query = new URLSearchParams(location.search);
const isStudentFlow =
  query.has("registration_token") ||
  query.has("attendance_token") ||
  query.get("connect") === "true";

if (isStudentFlow) {
  import("./student/main.js")
    .then(({ startStudentApp }) => startStudentApp())
    .catch((error) => {
      console.error("Student application failed to start:", error);
      document.querySelector("#app").innerHTML =
        "<main><h1>TuitionLedger</h1><p>The student page could not start. Refresh and try again.</p></main>";
    });
} else {
  window.addEventListener("hashchange", render);
  registerTutorPwa();
  render();
}
