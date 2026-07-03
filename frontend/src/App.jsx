import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import TutorLayout from './layouts/TutorLayout';
import StudentLayout from './layouts/StudentLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TutorDashboard from './pages/TutorDashboard';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceQRPage from './pages/AttendanceQRPage';
import FeesPage from './pages/FeesPage';
import ReportsPage from './pages/ReportsPage';
import RemindersPage from './pages/RemindersPage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';
import MorePage from './pages/MorePage';
import StudentDashboard from './pages/StudentDashboard';
import MarkAttendancePage from './pages/MarkAttendancePage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mark-attendance" element={<MarkAttendancePage />} />

            <Route path="/tutor" element={<Navigate to="/tutor/dashboard" replace />} />
            <Route path="/tutor/dashboard" element={<ProtectedRoute role="tutor"><TutorLayout><TutorDashboard /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/students" element={<ProtectedRoute role="tutor"><TutorLayout><StudentsPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/classes" element={<ProtectedRoute role="tutor"><TutorLayout><ClassesPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/attendance" element={<ProtectedRoute role="tutor"><TutorLayout><AttendancePage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/attendance/qr" element={<ProtectedRoute role="tutor"><TutorLayout><AttendanceQRPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/fees" element={<ProtectedRoute role="tutor"><TutorLayout><FeesPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/reports" element={<ProtectedRoute role="tutor"><TutorLayout><ReportsPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/reminders" element={<ProtectedRoute role="tutor"><TutorLayout><RemindersPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/devices" element={<ProtectedRoute role="tutor"><TutorLayout><DevicesPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/settings" element={<ProtectedRoute role="tutor"><TutorLayout><SettingsPage /></TutorLayout></ProtectedRoute>} />
            <Route path="/tutor/more" element={<ProtectedRoute role="tutor"><TutorLayout><MorePage /></TutorLayout></ProtectedRoute>} />

            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentLayout><StudentDashboard /></StudentLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
