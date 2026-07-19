import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Bot } from "lucide-react";

export const metadata = { title: "Agents" };

export default function AgentsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-heading">AI Agents</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Decision Specialist", role: "DECISION_SPECIALIST", color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/30" },
            { name: "Risk Specialist", role: "RISK_SPECIALIST", color: "text-error-500", bg: "bg-red-50 dark:bg-red-900/30" },
            { name: "Action Specialist", role: "ACTION_SPECIALIST", color: "text-accent-500", bg: "bg-accent-50 dark:bg-accent-900/30" },
          ].map((agent, i) => (
            <AnimatedCard key={agent.role} variant="flat" index={i}>
              <div className={`w-10 h-10 rounded-xl ${agent.bg} flex items-center justify-center mb-3`}>
                <Bot className={`w-5 h-5 ${agent.color}`} />
              </div>
              <h3 className="text-sm font-bold">{agent.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                AI specialist agent for meeting analysis
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-500" />
                <span className="text-xs text-[var(--muted)]">Active</span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
