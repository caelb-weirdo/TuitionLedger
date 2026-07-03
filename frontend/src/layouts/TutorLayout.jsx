import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/tutor/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
  { to: '/tutor/students', icon: 'fa-user-graduate', label: 'Students' },
  { to: '/tutor/classes', icon: 'fa-chalkboard', label: 'Classes' },
  { to: '/tutor/attendance', icon: 'fa-qrcode', label: 'Attendance' },
  { to: '/tutor/fees', icon: 'fa-money-bill-wave', label: 'Fees' },
  { to: '/tutor/reports', icon: 'fa-file-alt', label: 'Reports' },
  { to: '/tutor/reminders', icon: 'fa-bell', label: 'Reminders' },
  { to: '/tutor/devices', icon: 'fa-mobile-alt', label: 'Devices' },
  { to: '/tutor/settings', icon: 'fa-cog', label: 'Settings' },
];

const mobileItems = [
  { to: '/tutor/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
  { to: '/tutor/students', icon: 'fa-user-graduate', label: 'Students' },
  { to: '/tutor/attendance', icon: 'fa-qrcode', label: 'Attendance' },
  { to: '/tutor/fees', icon: 'fa-money-bill-wave', label: 'Fees' },
  { to: '/tutor/more', icon: 'fa-ellipsis-h', label: 'More' },
];

export default function TutorLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2><i className="fas fa-book-open"></i> TuitionLedger</h2>
          <span>Tutor Portal</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <i className={`fas ${item.icon}`}></i> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <nav className="mobile-nav">
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
