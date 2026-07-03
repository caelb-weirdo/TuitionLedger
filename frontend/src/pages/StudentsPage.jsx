import { useEffect, useState } from 'react';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const emptyForm = {
  full_name: '', username: '', email: '', password: '',
  parent_name: '', parent_phone_local: '', parent_phone_whatsapp: '',
  parent_email: '', address: '', class_ids: [],
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      studentService.getAll(search ? `search=${search}` : ''),
      classService.getAll(),
    ]).then(([sRes, cRes]) => {
      setStudents(sRes.data.students);
      setClasses(cRes.data.classes);
    }).catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ ...s, password: '', class_ids: [] });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { password, ...data } = form;
        await studentService.update(editId, data);
        showToast('Student updated', 'success');
      } else {
        await studentService.create(form);
        showToast('Student created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await studentService.delete(id);
      showToast('Student deleted', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const updateForm = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Students</h1><p>Manage your student records and parent contacts.</p></div>
        <button className="btn btn-primary no-print" onClick={openAdd}><i className="fas fa-plus"></i> Add Student</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-secondary btn-sm" type="submit"><i className="fas fa-search"></i></button>
          </form>
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }}></div></div>
          : students.length === 0 ? <EmptyState icon="user-graduate" title="No students yet" message="Add your first student to start managing attendance and fees." action={<button className="btn btn-primary" onClick={openAdd}>Add Student</button>} />
          : <>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Code</th><th>Parent</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.full_name}</strong><br /><span className="text-secondary" style={{ fontSize: 12 }}>{s.email}</span></td>
                    <td>{s.student_code}</td>
                    <td>{s.parent_name || '-'}</td>
                    <td>{s.parent_phone_local || '-'}</td>
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><i className="fas fa-edit"></i> Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-cards">
              {students.map((s) => (
                <div key={s.id} className="mobile-card-row">
                  <h4>{s.full_name}</h4>
                  <div className="row-detail">{s.student_code} · {s.parent_name}</div>
                  <div className="row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        }
      </div>

      <Modal title={editId ? 'Edit Student' : 'Add Student'} isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Full Name *</label><input value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} required /></div>
            <div className="form-group"><label>Username *</label><input value={form.username} onChange={(e) => updateForm('username', e.target.value)} required disabled={!!editId} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} /></div>
            {!editId && <div className="form-group"><label>Password *</label><input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} required /></div>}
            <div className="form-group"><label>Parent Name</label><input value={form.parent_name} onChange={(e) => updateForm('parent_name', e.target.value)} /></div>
            <div className="form-group"><label>Parent Phone</label><input value={form.parent_phone_local} onChange={(e) => updateForm('parent_phone_local', e.target.value)} placeholder="0771234567" /></div>
            <div className="form-group"><label>Parent WhatsApp</label><input value={form.parent_phone_whatsapp} onChange={(e) => updateForm('parent_phone_whatsapp', e.target.value)} placeholder="94771234567" /></div>
            <div className="form-group"><label>Parent Email</label><input value={form.parent_email} onChange={(e) => updateForm('parent_email', e.target.value)} /></div>
          </div>
          <div className="form-group">
            <label>Assign Classes</label>
            <select multiple value={form.class_ids} onChange={(e) => updateForm('class_ids', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ height: 80 }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
