import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const emptyForm = { subject: '', class_name: '', schedule_day: 'Saturday', start_time: '09:00', end_time: '11:00', fee_amount: '' };

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    classService.getAll().then((res) => setClasses(res.data.classes))
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, fee_amount: parseFloat(form.fee_amount) || 0 };
    try {
      if (editId) { await classService.update(editId, data); showToast('Class updated', 'success'); }
      else { await classService.create(data); showToast('Class created', 'success'); }
      setModalOpen(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Classes</h1><p>Manage your tuition classes and schedules.</p></div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <i className="fas fa-plus"></i> Add Class
        </button>
      </div>

      {loading ? <div className="skeleton skeleton-card" style={{ height: 200 }}></div>
        : classes.length === 0 ? <EmptyState icon="chalkboard" title="No classes yet" message="Create your first class to start generating QR attendance." action={<button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add Class</button>} />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {classes.map((c) => (
              <div key={c.id} className="card">
                <h3>{c.class_name}</h3>
                <p className="text-secondary">{c.subject}</p>
                <p style={{ margin: '12px 0' }}><i className="fas fa-calendar"></i> {c.schedule_day} · {c.start_time} - {c.end_time}</p>
                <p><i className="fas fa-money-bill"></i> Rs. {c.fee_amount}/month</p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-success btn-sm" onClick={() => navigate(`/tutor/attendance/qr?class_id=${c.id}`)}>
                    <i className="fas fa-qrcode"></i> Generate QR
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditId(c.id); setForm({ ...c, fee_amount: c.fee_amount }); setModalOpen(true); }}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    if (confirm('Delete class?')) { await classService.delete(c.id); showToast('Deleted', 'success'); load(); }
                  }}><i className="fas fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
      }

      <Modal title={editId ? 'Edit Class' : 'Add Class'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Subject *</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="form-group"><label>Class Name *</label><input value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} required /></div>
            <div className="form-group"><label>Day</label>
              <select value={form.schedule_day} onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Monthly Fee (Rs.)</label><input type="number" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} /></div>
            <div className="form-group"><label>Start Time</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
            <div className="form-group"><label>End Time</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Class</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
