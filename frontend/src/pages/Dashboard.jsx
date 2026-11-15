import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ChartCard from "@/components/ChartCard";
import {
  modelMetrics,
  featureImportance,
  predictionsVsActual,
  qualityClassification,
  trainingLoss,
} from "@/lib/demoData";

const tooltipStyle = {
  backgroundColor: "#1a1b2e",
  border: "1px solid #2a2b3d",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "#fff",
};

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---- Dashboard: ML model results -------------------------------------------
export default function Dashboard() {
  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">ML Model Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sleep quality prediction model · last trained {modelMetrics.lastTrained}
        </p>
      </div>

      {/* Model metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Accuracy" value={`${(modelMetrics.accuracy * 100).toFixed(1)}%`} hint="Overall correctness" />
        <StatTile label="F1 Score" value={modelMetrics.f1.toFixed(3)} hint="Precision / recall balance" />
        <StatTile label="R²" value={modelMetrics.r2.toFixed(3)} hint="Explained variance" />
        <StatTile label="RMSE" value={modelMetrics.rmse.toFixed(2)} hint="Score error (points)" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Predicted vs Actual Sleep Score" subtitle="Validation set performance">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={predictionsVsActual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" vertical={false} />
              <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 100]} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} iconType="circle" />
              <Line type="monotone" dataKey="actual" stroke="#baff43" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="predicted" stroke="#ff9a33" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Feature Importance" subtitle="Top contributing features">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={featureImportance}
              margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#888"
                fontSize={11}
                width={130}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="importance" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Quality Classification" subtitle="Predicted quality distribution" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={qualityClassification}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
              >
                {qualityClassification.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Training Loss Curve" subtitle="Loss vs validation loss per epoch" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trainingLoss} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" vertical={false} />
              <XAxis dataKey="epoch" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} iconType="circle" />
              <Line type="monotone" dataKey="loss" stroke="#818cf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="valLoss" stroke="#ff9a33" strokeWidth={2} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Training info */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Training Samples" value={modelMetrics.trainingSamples.toLocaleString()} />
        <StatTile label="Validation Samples" value={modelMetrics.validationSamples.toLocaleString()} />
        <StatTile label="Precision" value={modelMetrics.precision.toFixed(3)} />
        <StatTile label="Recall" value={modelMetrics.recall.toFixed(3)} />
      </div>
    </div>
  );
}
