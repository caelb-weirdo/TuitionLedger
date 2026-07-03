import { useEffect, useState } from 'react';
import { reportService } from '../services/feeService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import Badge from '../components/Badge';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [filters, setFilters] = useState({ month: 7, year: 2026, class_id: '', student_id: '' });
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getAll().then((res) => setClasses(res.data.classes));
    studentService.getAll().then((res) => setStudents(res.data.students));
  }, []);

  const generate = () => {
    setLoading(true);
    const params = new URLSearchParams({ type: reportType, ...filters });
    Object.keys(filters).forEach((k) => { if (!filters[k]) params.delete(k); });
    reportService.get(params.toString())
      .then((res) => setData(Array.isArray(res.data.report) ? res.data.report : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { generate(); }, [reportType]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Reports</h1><p>Generate and print attendance and fee reports.</p></div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="attendance">Attendance Report</option>
              <option value="fees">Fee Report</option>
              <option value="unpaid">Unpaid Students</option>
              <option value="student-history">Student History</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}><label>Month</label>
            <input type="number" min="1" max="12" value={filters.month} onChange={(e) => setFilters({ ...filters, month: +e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}><label>Year</label>
            <input type="number" value={filters.year} onChange={(e) => setFilters({ ...filters, year: +e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}><label>Class</label>
            <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}>
              <option value="">All</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          {reportType === 'student-history' && (
            <div className="form-group" style={{ margin: 0 }}><label>Student</label>
              <select value={filters.student_id} onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}>
                <option value="">Select</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Generate'}
          </button>
        </div>
      </div>

      <div className="table-container">
        {reportType === 'attendance' && (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>{data.map((r, i) => (
              <tr key={i}><td>{r.student_name}</td><td>{r.class_name}</td><td><Badge status={r.status} /></td><td>{r.method}</td><td>{r.marked_at}</td></tr>
            ))}</tbody>
          </table>
        )}
        {reportType === 'fees' && (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Class</th><th>Month</th><th>Due</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>{data.map((r, i) => (
              <tr key={i}><td>{r.student_name}</td><td>{r.class_name}</td><td>{r.month}/{r.year}</td>
                <td>Rs. {r.amount_due}</td><td>Rs. {r.amount_paid}</td><td><Badge status={r.status} /></td></tr>
            ))}</tbody>
          </table>
        )}
        {(reportType === 'unpaid') && (
          <table className="data-table">
            <thead><tr><th>Student</th><th>Class</th><th>Due</th><th>Paid</th><th>Status</th></tr></thead>
            <tbody>{data.map((r, i) => (
              <tr key={i}><td>{r.student_name}</td><td>{r.class_name}</td>
                <td>Rs. {r.amount_due}</td><td>Rs. {r.amount_paid}</td><td><Badge status={r.status} /></td></tr>
            ))}</tbody>
          </table>
        )}
        {data.length === 0 && !loading && <p className="text-secondary" style={{ padding: 24, textAlign: 'center' }}>No data for selected filters.</p>}
      </div>
    </div>
  );
}
