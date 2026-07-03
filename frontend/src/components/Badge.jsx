export default function Badge({ status }) {
  const map = {
    present: 'badge-present', paid: 'badge-paid', approved: 'badge-approved',
    absent: 'badge-absent', unpaid: 'badge-unpaid', rejected: 'badge-rejected',
    late: 'badge-late', partial: 'badge-partial', pending: 'badge-pending',
    overdue: 'badge-overdue',
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
}
