"use client";

import { useState } from "react";
import { Bot, CheckCircle2, AlertTriangle, ArrowDown, ChevronRight, Clock, DollarSign } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";

export interface AgentRunStep {
  stepId: string;
  agentName: string;
  status: "COMPLETED" | "REVISED" | "ESCALATED" | "PENDING";
  durationMs: number;
  costUsd: number;
  inputPrompt?: string;
  outputSummary?: string;
  revisionCount?: number;
}

interface RunTraceTreeProps {
  runId: string;
  steps: AgentRunStep[];
}

export function RunTraceTree({ runId, steps }: RunTraceTreeProps) {
  const [selectedStep, setSelectedStep] = useState<AgentRunStep | null>(steps[0] || null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Step Tree */}
      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-sm font-bold font-heading text-[var(--foreground)]">Execution Step Graph</h3>

        {steps.map((step, idx) => {
          const isSelected = selectedStep?.stepId === step.stepId;

          return (
            <div key={step.stepId || idx} className="space-y-3">
              <AnimatedCard
                variant={isSelected ? "clay" : "flat"}
                onClick={() => setSelectedStep(step)}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 border",
                  isSelected
                    ? "border-brand-500 ring-2 ring-brand-500/20"
                    : "border-[var(--border)] hover:border-brand-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{step.agentName}</h4>
                      <p className="text-xs text-[var(--muted)]">{step.outputSummary || "Executed analysis phase"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {step.durationMs}ms
                    </span>
                    <span
                      className={cn(
                        "font-semibold px-2 py-0.5 rounded-full text-[10px]",
                        step.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      )}
                    >
                      {step.status}
                    </span>
                  </div>
                </div>
              </AnimatedCard>

              {idx < steps.length - 1 && (
                <div className="flex justify-center my-1 text-[var(--muted)]">
                  <ArrowDown className="w-4 h-4 opacity-40 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Col: Detailed Step Inspector */}
      <div>
        <AnimatedCard variant="clay" className="p-5 space-y-4 sticky top-20">
          <h3 className="text-sm font-bold font-heading border-b border-[var(--border)] pb-2">
            Step Inspector
          </h3>

          {selectedStep ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[var(--muted)] block">Agent</span>
                <span className="font-bold text-sm text-[var(--foreground)]">{selectedStep.agentName}</span>
              </div>

              <div>
                <span className="font-semibold text-[var(--muted)] block">Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedStep.status} (Revisions: {selectedStep.revisionCount || 0})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono">
                <div>
                  <span className="text-[var(--muted)] block text-[10px]">DURATION</span>
                  <span className="font-semibold">{selectedStep.durationMs} ms</span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px]">ESTIMATED COST</span>
                  <span className="font-semibold">${selectedStep.costUsd?.toFixed(5) || "0.00010"}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[var(--muted)] block mb-1">Output Summary</span>
                <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono text-[11px] max-h-40 overflow-y-auto leading-relaxed">
                  {selectedStep.outputSummary || "Phase executed without warnings or escalation."}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)]">Select a step in the tree to inspect details.</p>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}
