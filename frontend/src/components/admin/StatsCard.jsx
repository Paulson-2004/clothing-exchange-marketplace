// Dashboard metric card showing a label and count value.

function StatsCard({ label, value, icon }) {
  return (
    <div className="stats-card">
      {icon && <span className="stats-card-icon">{icon}</span>}
      <div className="stats-card-content">
        <span className="stats-card-value">{value}</span>
        <span className="stats-card-label">{label}</span>
      </div>
    </div>
  );
}

export default StatsCard;
