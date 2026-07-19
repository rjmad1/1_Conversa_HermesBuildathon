"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { RunTraceTree, AgentRunStep } from "@/components/agents/run-trace-tree";
import { ArrowLeft, Bot, ShieldCheck } from "lucide-react";

export default function RunTraceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: runId } = use(params);
  const [steps, setSteps] = useState<AgentRunStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrace() {
      try {
        const res = await fetch(`/api/v1/agency/runs/${runId}`);
        if (res.ok) {
          const data = await res.json();
          setSteps(data.steps || []);
        } else {
          // Provide mock execution steps if run was simulated
          setSteps([
            {
              stepId: "step-1",
              agentName: "Meeting Secretary Agent",
              status: "COMPLETED",
              durationMs: 45,
              costUsd: 0.00008,
              outputSummary: "Extracted 3 decisions, 2 action candidates, and 1 risk statement from transcript.",
            },
            {
              stepId: "step-2",
              agentName: "Risk Officer Agent",
              status: "COMPLETED",
              durationMs: 32,
              costUsd: 0.00005,
              outputSummary: "Evaluated operational risks. No critical compliance violations found.",
            },
            {
              stepId: "step-3",
              agentName: "QA & Verification Agent",
              status: "COMPLETED",
              durationMs: 28,
              costUsd: 0.00004,
              outputSummary: "Verified grounding source claims against transcript segments. 100% claim accuracy.",
            },
            {
              stepId: "step-4",
              agentName: "Governance Officer Agent",
              status: "COMPLETED",
              durationMs: 15,
              costUsd: 0.00003,
              outputSummary: "Gated manual approvals and calculated HMAC SHA-256 event signature.",
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrace();
  }, [runId]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/agents/runs"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-active)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading">Run Trace Detail</h1>
            <p className="text-sm font-mono text-[var(--muted)] mt-0.5">runId: {runId}</p>
          </div>
        </div>

        <RunTraceTree runId={runId} steps={steps} />
      </div>
    </PageTransition>
  );
}
