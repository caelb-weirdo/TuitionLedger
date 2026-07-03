import { useEffect, useState } from 'react';
import { reminderService } from '../services/feeService';
import Badge from '../components/Badge';
import { formatDateTime } from '../utils/formatDate';

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    reminderService.getAll().then((res) => setReminders(res.data.reminders));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Reminder History</h1>
        <p>Track WhatsApp and phone reminders sent to parents.</p>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Type</th><th>Status</th><th>Message</th><th>Date</th><th>Confirmed</th></tr></thead>
          <tbody>
            {reminders.map((r) => (
              <tr key={r.id}>
                <td>{r.student_name}</td>
                <td><i className={`${r.reminder_type === 'whatsapp' ? 'fab fa-whatsapp' : 'fas fa-phone'}`}></i> {r.reminder_type}</td>
                <td><Badge status={r.status === 'confirmed_sent' ? 'approved' : 'pending'} /></td>
                <td style={{ maxWidth: 200, fontSize: 12 }}>{r.message?.substring(0, 60)}...</td>
                <td>{formatDateTime(r.created_at)}</td>
                <td>{r.confirmed_at ? formatDateTime(r.confirmed_at) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reminders.length === 0 && <p className="text-secondary" style={{ padding: 24, textAlign: 'center' }}>No reminders yet.</p>}
      </div>
    </div>
  );
}
