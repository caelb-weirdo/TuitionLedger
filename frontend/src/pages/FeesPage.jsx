import { useEffect, useState } from 'react';
import { feeService } from '../services/feeService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { reminderService } from '../services/feeService';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [unpaid, setUnpaid] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tab, setTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', class_id: '', month: 7, year: 2026, amount_due: '', amount_paid: 0, status: 'unpaid', payment_date: '', notes: '' });
  const [pendingReminder, setPendingReminder] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    Promise.all([
      feeService.getAll(),
      feeService.getUnpaid(),
      studentService.getAll(),
      classService.getAll(),
    ]).then(([fRes, uRes, sRes, cRes]) => {
      setFees(fRes.data.fees);
      setUnpaid(uRes.data.students);
      setStudents(sRes.data.students);
      setClasses(cRes.data.classes);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await feeService.create({ ...form, amount_due: parseFloat(form.amount_due), amount_paid: parseFloat(form.amount_paid) });
      showToast('Fee record saved', 'success');
      setModalOpen(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleWhatsapp = async (student) => {
    try {
      const res = await reminderService.prepareWhatsapp(student.student_id, student.id);
      window.open(res.data.wa_link, '_blank');
      setPendingReminder({ id: res.data.reminder_id, student: student.student_name });
      showToast('WhatsApp opened. Send the message, then confirm below.', 'info');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handlePhone = async (student) => {
    try {
      const res = await reminderService.preparePhone(student.student_id, student.id);
      window.open(res.data.tel_link, '_blank');
      setPendingReminder({ id: res.data.reminder_id, student: student.student_name });
    } catch (err) { showToast(err.message, 'error'); }
  };

  const confirmReminder = async () => {
    try {
      await reminderService.confirm(pendingReminder.id);
      showToast('Reminder confirmed as sent', 'success');
      setPendingReminder(null);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const displayData = tab === 'unpaid' ? unpaid : fees;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Fees</h1><p>Track monthly payments and send reminders.</p></div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><i className="fas fa-plus"></i> Add Payment</button>
      </div>

      {pendingReminder && (
        <div className="card" style={{ marginBottom: 16, background: '#F0FDF4', border: '1px solid var(--color-success)' }}>
          <p>Did you send the reminder to <strong>{pendingReminder.student}</strong>?</p>
          <button className="btn btn-success btn-sm" onClick={confirmReminder}><i className="fas fa-check"></i> I sent this reminder</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>All Records</button>
        <button className={`btn ${tab === 'unpaid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('unpaid')}>Unpaid Students</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Class</th><th>Month</th><th>Due</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {displayData.map((f) => (
              <tr key={f.id}>
                <td>{f.student_name}</td>
                <td>{f.class_name}</td>
                <td>{f.month}/{f.year}</td>
                <td>Rs. {f.amount_due}</td>
                <td>Rs. {f.amount_paid}</td>
                <td><Badge status={f.status} /></td>
                <td className="actions">
                  {['unpaid', 'partial', 'overdue'].includes(f.status) && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleWhatsapp(f)}>
                        <i className="fab fa-whatsapp"></i> WhatsApp
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handlePhone(f)}>
                        <i className="fas fa-phone"></i> Call
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Add Fee Record" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Student</label>
              <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
                <option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Class</label>
              <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} required>
                <option value="">Select</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Month</label><input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })} /></div>
            <div className="form-group"><label>Year</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} /></div>
            <div className="form-group"><label>Amount Due</label><input type="number" value={form.amount_due} onChange={(e) => setForm({ ...form, amount_due: e.target.value })} required /></div>
            <div className="form-group"><label>Amount Paid</label><input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="paid">Paid</option><option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option><option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group"><label>Payment Date</label><input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
