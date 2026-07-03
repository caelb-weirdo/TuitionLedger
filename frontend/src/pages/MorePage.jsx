import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MorePage() {
  const { logout } = useAuth();

  const items = [
    { to: '/tutor/classes', icon: 'fa-chalkboard', label: 'Classes' },
    { to: '/tutor/reports', icon: 'fa-file-alt', label: 'Reports' },
    { to: '/tutor/reminders', icon: 'fa-bell', label: 'Reminders' },
    { to: '/tutor/devices', icon: 'fa-mobile-alt', label: 'Devices' },
    { to: '/tutor/settings', icon: 'fa-cog', label: 'Settings' },
  ];

  return (
    <div>
      <div className="page-header"><h1>More</h1><p>Additional features and settings.</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit' }}>
            <i className={`fas ${item.icon}`} style={{ fontSize: 20, color: 'var(--color-primary)', width: 24 }}></i>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }}></i>
          </Link>
        ))}
        <button className="card" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 16, border: 'none', textAlign: 'left', cursor: 'pointer' }}>
          <i className="fas fa-sign-out-alt" style={{ fontSize: 20, color: 'var(--color-danger)', width: 24 }}></i>
          <span style={{ fontWeight: 500, color: 'var(--color-danger)' }}>Logout</span>
        </button>
      </div>
    </div>
  );
}
