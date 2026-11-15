export default function MetricCard({ title, value, unit, description }) {
  return (
    <section className="metric-card">
      <h2>{title}</h2>
      <p>{value}{unit && <span> {unit}</span>}</p>
      {description && <p>{description}</p>}
    </section>
  );
}
