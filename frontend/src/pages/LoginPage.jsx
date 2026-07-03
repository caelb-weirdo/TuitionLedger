import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(identifier, password);
      showToast('Login successful!', 'success');
      const redirect = location.state?.from;
      if (redirect) {
        navigate(redirect);
      } else if (data.user.role === 'tutor') {
        navigate('/tutor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <h1><i className="fas fa-book-open"></i> TuitionLedger</h1>
        <p>A mobile-friendly tuition class management system for QR attendance, fee tracking, and parent reminders.</p>
        <ul className="auth-brand-features">
          <li><i className="fas fa-check-circle"></i> QR-code attendance with device verification</li>
          <li><i className="fas fa-check-circle"></i> Monthly fee tracking & reports</li>
          <li><i className="fas fa-check-circle"></i> WhatsApp click-to-chat reminders</li>
          <li><i className="fas fa-check-circle"></i> Built for Sri Lankan tuition tutors</li>
        </ul>
      </div>
      <div className="auth-form-side">
        <div className="card" style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ marginBottom: 8 }}>Welcome Back</h2>
          <p className="text-secondary" style={{ marginBottom: 24 }}>Sign in to your account</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email or Username</label>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="tutor@tuitionledger.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner"></span> : <><i className="fas fa-sign-in-alt"></i> Login</>}
            </button>
          </form>
          <p className="text-secondary" style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
            Demo: tutor@tuitionledger.com / Tutor@123
          </p>
        </div>
      </div>
    </div>
  );
}
