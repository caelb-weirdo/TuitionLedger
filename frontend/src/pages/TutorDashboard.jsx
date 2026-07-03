import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/feeService';
import SkeletonGrid from '../components/Skeleton';
import Badge from '../components/Badge';
import { formatDateTime } from '../utils/formatDate';

export default function TutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSummary()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = data ? [
    { label: 'Total Students', value: data.total_students, icon: 'fa-user-graduate', color: 'teal', link: '/tutor/students' },
    { label: 'Present Today', value: data.present_today, icon: 'fa-check-circle', color: 'green', link: '/tutor/attendance' },
    { label: 'Absent Today', value: data.absent_today, icon: 'fa-times-circle', color: 'red', link: '/tutor/attendance' },
    { label: 'Paid This Month', value: data.paid_this_month, icon: 'fa-money-bill', color: 'green', link: '/tutor/fees' },
    { label: 'Unpaid This Month', value: data.unpaid_this_month, icon: 'fa-exclamation-circle', color: 'red', link: '/tutor/fees' },
    { label: 'Pending Devices', value: data.pending_devices, icon: 'fa-mobile-alt', color: 'orange', link: '/tutor/devices' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Here's your tuition class overview for today.</p>
      </div>

      {loading ? <SkeletonGrid /> : (
        <div className="dashboard-grid">
          {cards.map((card) => (
            <div key={card.label} className="stat-card" onClick={() => navigate(card.link)}>
              <div className={`stat-card-icon ${card.color}`}><i className={`fas ${card.icon}`}></i></div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-value">{card.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}><i className="fas fa-clock"></i> Recent Attendance</h3>
          {data?.recent_attendance?.length ? data.recent_attendance.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <strong>{r.student_name}</strong>
                <div className="text-secondary" style={{ fontSize: 12 }}>{r.class_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge status={r.status} />
                <div className="text-secondary" style={{ fontSize: 11 }}>{formatDateTime(r.marked_at)}</div>
              </div>
            </div>
          )) : <p className="text-secondary">No recent attendance records.</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}><i className="fas fa-money-bill-wave"></i> Recent Fee Updates</h3>
          {data?.recent_fees?.length ? data.recent_fees.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <strong>{r.student_name}</strong>
                <div className="text-secondary" style={{ fontSize: 12 }}>{r.class_name}</div>
              </div>
              <Badge status={r.status} />
            </div>
          )) : <p className="text-secondary">No recent fee updates.</p>}
        </div>
      </div>
    </div>
  );
}
