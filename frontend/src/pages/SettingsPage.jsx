import { useEffect, useState } from 'react';
import { settingsService } from '../services/feeService';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const [form, setForm] = useState({ default_qr_minutes: 5, whatsapp_template: '', phone_template: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    settingsService.get().then((res) => setForm(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await settingsService.update(form);
      showToast('Settings saved', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure QR defaults and reminder message templates.</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Default QR Time (minutes)</label>
            <select value={form.default_qr_minutes} onChange={(e) => setForm({ ...form, default_qr_minutes: +e.target.value })}>
              <option value={3}>3 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
          </div>
          <div className="form-group">
            <label>WhatsApp Reminder Template</label>
            <textarea value={form.whatsapp_template} onChange={(e) => setForm({ ...form, whatsapp_template: e.target.value })} rows={4}
              placeholder="Use {student_name} and {month} as variables" />
          </div>
          <div className="form-group">
            <label>Phone Reminder Template</label>
            <textarea value={form.phone_template} onChange={(e) => setForm({ ...form, phone_template: e.target.value })} rows={3} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : <><i className="fas fa-save"></i> Save Settings</>}
          </button>
        </form>
      </div>
    </div>
  );
}
