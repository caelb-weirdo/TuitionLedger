import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { formatDateTime } from '../utils/formatDate';
import { useToast } from '../context/ToastContext';

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', status: '' });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ student_id: '', class_id: '', session_id: '', status: 'present', manual_reason: '' });
  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    const params = new URLSearchParams();
    if (filters.class_id) params.set('class_id', filters.class_id);
    if (filters.status) params.set('status', filters.status);
    Promise.all([
      classService.getAll(),
      attendanceService.getRecords(params.toString()),
      studentService.getAll(),
    ]).then(([cRes, aRes, sRes]) => {
      setClasses(cRes.data.classes);
      setRecords(aRes.data.records);
      setStudents(sRes.data.students);
    });
  };

  useEffect(() => { load(); }, [filters]);

  const handleManual = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.manualAttendance(manualForm);
      showToast('Attendance updated', 'success');
      setManualOpen(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div><h1>Attendance</h1><p>View records, generate QR codes, and correct attendance.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success" onClick={() => navigate('/tutor/attendance/qr')}>
            <i className="fas fa-qrcode"></i> Generate QR
          </button>
          <button className="btn btn-secondary" onClick={() => setManualOpen(true)}>
            <i className="fas fa-edit"></i> Manual Update
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
        <table className="data-table">
          <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Method</th><th>Time</th><th>Reason</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.student_name}</td>
                <td>{r.class_name}</td>
                <td><Badge status={r.status} /></td>
                <td>{r.method}</td>
                <td>{formatDateTime(r.marked_at)}</td>
                <td className="text-secondary" style={{ fontSize: 12 }}>{r.manual_reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="text-secondary" style={{ padding: 24, textAlign: 'center' }}>No attendance records found.</p>}
      </div>

      <Modal title="Manual Attendance Correction" isOpen={manualOpen} onClose={() => setManualOpen(false)}>
        <form onSubmit={handleManual}>
          <div className="form-group"><label>Student *</label>
            <select value={manualForm.student_id} onChange={(e) => setManualForm({ ...manualForm, student_id: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Class *</label>
            <select value={manualForm.class_id} onChange={(e) => setManualForm({ ...manualForm, class_id: e.target.value })} required>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Session ID *</label>
            <input value={manualForm.session_id} onChange={(e) => setManualForm({ ...manualForm, session_id: e.target.value })} placeholder="Paste session UUID" required />
          </div>
          <div className="form-group"><label>Status *</label>
            <select value={manualForm.status} onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>
          <div className="form-group"><label>Reason *</label>
            <textarea value={manualForm.manual_reason} onChange={(e) => setManualForm({ ...manualForm, manual_reason: e.target.value })} required rows={3} placeholder="e.g. Student forgot device" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setManualOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Save Attendance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
