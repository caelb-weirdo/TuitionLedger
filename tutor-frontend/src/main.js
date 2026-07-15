import "./style.css";
import "./logo.css";
import "./auth-submit-fix.js";
import { auth } from './core/api.js';
import { landing } from './pages/landing.js';
import { authPage } from './pages/auth.js';
import { dashboard } from './pages/dashboard.js';
import { studentsPage } from './pages/students.js';
import { classesPage } from './pages/classes.js';
import { attendanceWorkspacePage } from './pages/attendance.js';
import { feesPage } from './pages/fees.js';
import { settingsPage } from './pages/settings.js';
function render() {
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
        attendance: attendanceWorkspacePage,
        fees: feesPage,
        settings: settingsPage,
      })[p] || dashboard
    )();
}
window.addEventListener("hashchange", render);
render();
