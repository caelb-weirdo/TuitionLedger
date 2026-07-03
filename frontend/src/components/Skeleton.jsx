export default function SkeletonGrid({ count = 6 }) {
  return (
    <div className="dashboard-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card"></div>
      ))}
    </div>
  );
}
