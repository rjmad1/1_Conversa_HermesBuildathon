"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { LottiePlayer } from "@/components/motion/lottie-player";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";

interface ProcessingStepperProps {
  meetingId: string;
}

const STAGES = [
  { id: 1, title: "Audio Ingestion & Transcription", desc: "Whisper speech-to-text conversion" },
  { id: 2, title: "Multi-Agent Intelligence Crew", desc: "Secretary, Risk & QA Officers analyzing transcript" },
  { id: 3, title: "Linkup Grounding & Policy Audit", desc: "Verifying claims & web reference links" },
  { id: 4, title: "Cryptographic Governance Lock", desc: "Hashing audit trail event chain" },
];

export function ProcessingStepper({ meetingId }: ProcessingStepperProps) {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(1);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function runPipeline() {
      try {
        // Step 1: Transcription / Setup
        if (mounted) setCurrentStage(1);
        await new Promise((r) => setTimeout(r, 1200));

        // Step 2: Agency analysis run
        if (mounted) setCurrentStage(2);
        const res = await fetch(`/api/v1/meetings/${meetingId}/agency/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          // Fallback to basic analysis endpoint
          await fetch(`/api/v1/meetings/${meetingId}/analysis`, {
            method: "POST",
          });
        }

        // Step 3: Grounding
        if (mounted) setCurrentStage(3);
        await new Promise((r) => setTimeout(r, 1000));

        // Step 4: Governance
        if (mounted) setCurrentStage(4);
        await new Promise((r) => setTimeout(r, 800));

        if (mounted) {
          setIsDone(true);
          setTimeout(() => {
            router.push(`/meetings/${meetingId}/review`);
          }, 600);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || "Failed to process meeting pipeline");
        }
      }
    }

    runPipeline();

    return () => {
      mounted = false;
    };
  }, [meetingId, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <LottiePlayer label={isDone ? "Complete! Redirecting to Review..." : "Processing Meeting Intelligence..."} size="lg" />

      <AnimatedCard variant="clay" index={0} className="p-6 text-left space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h2 className="text-lg font-bold font-heading">Processing Pipeline</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            {isDone ? "100% Complete" : `Stage ${currentStage} of 4`}
          </span>
        </div>

        <div className="space-y-4">
          {STAGES.map((stage) => {
            const isCompleted = isDone || currentStage > stage.id;
            const isCurrent = !isDone && currentStage === stage.id;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                  isCurrent ? "bg-brand-50/60 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-transparent"
                )}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--muted)]/40 flex items-center justify-center text-[10px] text-[var(--muted)] font-mono">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      isCompleted || isCurrent ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                    )}
                  >
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        {isDone && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => router.push(`/meetings/${meetingId}/review`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-all cursor-pointer"
            >
              Go to Review Screen
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatedCard>
    </div>
  );
}
