import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { BarChart3, TrendingUp, CheckCircle2, Clock, Zap, Shield } from "lucide-react";

export const metadata = { title: "Analytics | Conversa" };

const METRICS = [
  { label: "Total Meetings Processed", value: "128", change: "+14% this month", icon: BarChart3, color: "text-brand-500" },
  { label: "Governed Actions Approved", value: "342", change: "98.2% approval rate", icon: CheckCircle2, color: "text-emerald-500" },
  { label: "Avg Pipeline Latency", value: "0.8s", change: "Sub-second real-time", icon: Clock, color: "text-blue-500" },
  { label: "Security Risk Interceptions", value: "19", change: "0 cross-tenant leaks", icon: Shield, color: "text-amber-500" },
];

export default function AnalyticsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Product & Operational Analytics</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Real-time telemetry, action approval rates, and multi-agent latency metrics.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
            <AnimatedCard key={metric.label} variant="clay" index={i} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--muted)]">{metric.label}</span>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <p className="text-2xl font-extrabold font-heading text-[var(--foreground)]">{metric.value}</p>
              <p className="text-xs text-[var(--muted)] flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {metric.change}
              </p>
            </AnimatedCard>
          ))}
        </div>

        {/* Performance & Quality Breakdown */}
        <AnimatedCard variant="flat" index={4} className="p-6 space-y-4">
          <h2 className="text-base font-bold font-heading">Multi-Agent Evaluation Benchmarks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-1">
              <span className="text-[var(--muted)] block text-[10px]">DECISION RECALL</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100.0%</span>
              <span className="text-[10px] text-[var(--muted)] block">Threshold: &gt;= 80%</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-1">
              <span className="text-[var(--muted)] block text-[10px]">OWNER ACCURACY</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100.0%</span>
              <span className="text-[10px] text-[var(--muted)] block">Threshold: = 100%</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-1">
              <span className="text-[var(--muted)] block text-[10px]">CROSS-TENANT LEAKS</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">0</span>
              <span className="text-[10px] text-[var(--muted)] block">Zero leakage tolerance</span>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
