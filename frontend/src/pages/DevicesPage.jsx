import { useEffect, useState } from 'react';
import { deviceService } from '../services/attendanceService';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { formatDateTime } from '../utils/formatDate';
import { useToast } from '../context/ToastContext';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');
  const { showToast } = useToast();

  const load = () => {
    const params = filter ? `status=${filter}` : '';
    deviceService.getAll(params).then((res) => setDevices(res.data.devices));
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id) => {
    try { await deviceService.approve(id); showToast('Device approved', 'success'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const reject = async () => {
    try { await deviceService.reject(rejectId, reason); showToast('Device rejected', 'success'); setRejectId(null); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Device Approvals</h1>
        <p>Approve or reject student device registration requests.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(s)}>{s || 'All'}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Device</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.student_name}</td>
                <td>{d.device_name}</td>
                <td><Badge status={d.status} /></td>
                <td>{formatDateTime(d.requested_at)}</td>
                <td className="actions">
                  {d.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => approve(d.id)}><i className="fas fa-check"></i> Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setRejectId(d.id)}><i className="fas fa-times"></i> Reject</button>
                    </>
                  )}
                  {d.rejection_reason && <span className="text-secondary" style={{ fontSize: 12 }}>{d.rejection_reason}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title="Reject Device" isOpen={!!rejectId} onClose={() => setRejectId(null)}>
        <div className="form-group"><label>Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setRejectId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={reject}>Reject Device</button>
        </div>
      </Modal>
    </div>
  );
}
