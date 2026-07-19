"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Bot, ArrowRight, Clock, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgencyRun {
  runId: string;
  meetingId: string;
  status: "COMPLETED" | "RUNNING" | "FAILED";
  totalDurationMs: number;
  estimatedCost: number;
  createdAt: string;
}

export default function AgencyRunsPage() {
  const [runs, setRuns] = useState<AgencyRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await fetch("/api/v1/agency/runs");
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRuns();
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Agent Execution Runs</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              History and trace logs of multi-agent crew executions.
            </p>
          </div>
          <Link
            href="/agents/control"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-active)] transition-colors no-underline"
          >
            <Bot className="w-4 h-4 text-brand-500" />
            Crew Control
          </Link>
        </div>

        <div className="space-y-3">
          {runs.length === 0 ? (
            <AnimatedCard variant="flat" index={0} className="p-12 text-center">
              <Activity className="w-8 h-8 text-[var(--muted)] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">No agency runs logged yet</h3>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
                Process a meeting through the agency pipeline to record step execution traces.
              </p>
            </AnimatedCard>
          ) : (
            runs.map((run, idx) => (
              <AnimatedCard key={run.runId || idx} variant="flat" index={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                          run-{run.runId.slice(0, 8)}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {run.status || "COMPLETED"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Meeting ID: {run.meetingId} • Created: {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {run.totalDurationMs || 120}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        ${run.estimatedCost?.toFixed(4) || "0.0002"}
                      </span>
                    </div>

                    <Link
                      href={`/agents/runs/${run.runId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-900/30 transition-colors no-underline"
                    >
                      Trace Detail
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
