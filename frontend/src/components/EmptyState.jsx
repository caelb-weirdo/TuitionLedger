export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      <i className={`fas fa-${icon}`}></i>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
