import { cn } from "@/lib/utils";

export default function ChartCard({ title, subtitle, action, className, children }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
