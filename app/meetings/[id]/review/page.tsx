"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { ActionApprovalCard, ProposedActionItem } from "@/components/meetings/action-approval-card";
import { MeetingChatPanel } from "@/components/meetings/meeting-chat-panel";
import { ShieldAlert, CheckCircle2, AlertTriangle, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingAnalysis {
  decisions: { id: string; description: string }[];
  risks: string[];
  proposedActions: ProposedActionItem[];
}

export default function MeetingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("Meeting Review");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, aRes] = await Promise.all([
          fetch(`/api/v1/meetings/${meetingId}`),
          fetch(`/api/v1/meetings/${meetingId}/analysis`),
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData.meeting?.title) setMeetingTitle(mData.meeting.title);
        }

        if (aRes.ok) {
          const aData = await aRes.json();
          setAnalysis(aData.analysis || aData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [meetingId]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                Analysis Complete
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading">{meetingTitle}</h1>
          </div>

          <Link
            href={`/meetings/${meetingId}/audit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-active)] transition-colors no-underline"
          >
            <Shield className="w-4 h-4 text-brand-500" />
            View Audit Log
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Decisions, Risks, Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Decisions */}
            <AnimatedCard variant="clay" index={0} className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold font-heading">Key Decisions</h2>
              </div>

              {analysis?.decisions && analysis.decisions.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--foreground)]">
                  {analysis.decisions.map((dec, i) => (
                    <li key={dec.id || i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--background)]/60">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span>{dec.description || (dec as any)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--muted)]">No explicit decisions recorded in this meeting.</p>
              )}
            </AnimatedCard>

            {/* Identified Risks */}
            <AnimatedCard variant="clay" index={1} className="p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold font-heading">Identified Risks & Governance Concerns</h2>
              </div>

              {analysis?.risks && analysis.risks.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--foreground)]">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--muted)]">No security or operational risks flagged.</p>
              )}
            </AnimatedCard>

            {/* Proposed Governed Actions */}
            <div className="space-y-3">
              <h2 className="text-base font-bold font-heading">Proposed Governed Actions</h2>
              {analysis?.proposedActions && analysis.proposedActions.length > 0 ? (
                analysis.proposedActions.map((act) => (
                  <ActionApprovalCard key={act.id} meetingId={meetingId} action={act} />
                ))
              ) : (
                <AnimatedCard variant="flat" index={2} className="p-6 text-center text-xs text-[var(--muted)]">
                  No proposed actions require human approval for this meeting.
                </AnimatedCard>
              )}
            </div>
          </div>

          {/* Right Col: AI Q&A Panel */}
          <div>
            <MeetingChatPanel meetingId={meetingId} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
