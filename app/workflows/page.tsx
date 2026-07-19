import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Workflow, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Workflows | Conversa" };

const WORKFLOWS = [
  {
    id: "wf-1",
    name: "Sprint Retrospective Automation",
    trigger: "Audio Upload / Meeting End",
    actions: ["Transcribe via Whisper", "Extract Blockers & Risks", "Create Jira / Linear Issues", "Send Slack Summary"],
    status: "Active",
  },
  {
    id: "wf-2",
    name: "Executive Architecture Governance",
    trigger: "Design Review Meeting",
    actions: ["Extract Architecture Decisions", "Verify Grounding Links", "HMAC Audit Chain Lock", "Notify Stakeholders"],
    status: "Active",
  },
  {
    id: "wf-3",
    name: "Competitive Intelligence Sweep",
    trigger: "Daily Cron Schedule",
    actions: ["Scrape Pricing & Changelogs", "Run Diff Analyzer", "QA Grounding Filter", "Dispatch Battlecard Digest"],
    status: "Active",
  },
];

export default function WorkflowsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Automated Workflows</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Trigger multi-agent pipelines and tool dispatches automatically.
            </p>
          </div>

          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm no-underline"
          >
            <Play className="w-3.5 h-3.5" />
            Run Workflow
          </Link>
        </div>

        <div className="space-y-4">
          {WORKFLOWS.map((wf, i) => (
            <AnimatedCard key={wf.id} variant="clay" index={i} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 flex items-center justify-center">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{wf.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Trigger: {wf.trigger}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {wf.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-2 border-t border-[var(--border)]">
                {wf.actions.map((act, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {act}
                  </span>
                ))}
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
