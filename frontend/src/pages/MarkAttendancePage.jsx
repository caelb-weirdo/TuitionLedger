import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { getDeviceToken } from '../utils/deviceToken';

export default function MarkAttendancePage() {
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('session_token');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: `/mark-attendance?session_token=${sessionToken}` } });
      return;
    }
    if (!sessionToken) {
      setResult({ type: 'error', message: 'Invalid attendance link.' });
      return;
    }
    if (user.role !== 'student') {
      setResult({ type: 'error', message: 'Only students can mark attendance.' });
      return;
    }

    const mark = async () => {
      setLoading(true);
      try {
        const res = await attendanceService.markAttendance(sessionToken, getDeviceToken());
        setResult({ type: 'success', message: res.message, data: res.data });
      } catch (err) {
        const type = err.code === 'ATTENDANCE_ALREADY_MARKED' ? 'info' : 'error';
        setResult({ type, message: err.message });
      } finally {
        setLoading(false);
      }
    };
    mark();
  }, [user, authLoading, sessionToken]);

  if (authLoading || loading) {
    return (
      <div className="attendance-result">
        <div className="spinner spinner-dark" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  if (!result) return null;

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

  return (
    <div className="attendance-result">
      <div className={`result-card ${result.type}`}>
        <div className="result-icon"><i className={`fas ${icons[result.type]}`}></i></div>
        <h2>{result.message}</h2>
        {result.data && (
          <div style={{ marginTop: 16 }}>
            <p><strong>{result.data.student_name}</strong></p>
            <p className="text-secondary">{result.data.class_name}</p>
            <p>Status: <strong>{result.data.status}</strong></p>
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/student/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
