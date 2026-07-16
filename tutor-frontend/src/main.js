import "./style.css";
import "./logo.css";
import { auth } from "./core/api.js";
import { landing } from "./pages/landing.js";
import { authPage } from "./pages/auth.js";
import { dashboard } from "./pages/dashboard.js";
import { studentsPage } from "./pages/students.js";
import { classesPage } from "./pages/classes.js";
import { qrSessionPage } from "./pages/qr-session.js";
import { attendanceWorkspacePage } from "./pages/attendance.js";
import { feesPage } from "./pages/fees.js";
import { registerTutorPwa } from "./pwa.js";
function render() {
  if (window.__studentsRefreshTimer) {
    window.clearInterval(window.__studentsRefreshTimer);
    window.__studentsRefreshTimer = null;
  }
  const p = (location.hash.slice(1) || "top").split("?")[0];
  if (p === "top") landing();
  else if (p === "login") authPage();
  else if (p === "signup") authPage(true);
  else if (!auth()) authPage();
  else
    (
      ({
        dashboard,
        students: studentsPage,
        classes: classesPage,
        "qr-session": qrSessionPage,
        attendance: attendanceWorkspacePage,
        fees: feesPage,
      })[p] || dashboard
    )();
}
window.addEventListener("hashchange", render);
registerTutorPwa();
render();
