export default function ChartCard({ title, description, children }) {
  return (
    <section className="chart-card">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </section>
  );
}
