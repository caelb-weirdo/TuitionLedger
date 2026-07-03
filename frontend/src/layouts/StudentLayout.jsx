import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
      <header style={{
        background: 'white', borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{ color: 'var(--color-primary)', fontSize: 18 }}>
          <i className="fas fa-book-open"></i> TuitionLedger
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="text-secondary">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login'); }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>
      <main style={{ padding: '24px 16px', maxWidth: 600, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
