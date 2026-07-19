"use client";

import { useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { AudioUpload } from "@/components/meetings/audio-upload";
import { TranscriptPaste } from "@/components/meetings/transcript-paste";
import { MeetingChatPanel } from "@/components/meetings/meeting-chat-panel";
import { BrainCircuit, Mic, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"audio" | "transcript">("transcript");
  const [demoMeetingId] = useState("demo-workspace-meeting");

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">AI Interactive Workspace</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Unified canvas for audio processing, multi-agent analysis, and instant RAG chat.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <BrainCircuit className="w-4 h-4 text-brand-500" />
            Live RAG Engine Active
          </span>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input & Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] w-fit text-xs">
              <button
                onClick={() => setActiveTab("transcript")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
                  activeTab === "transcript"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Transcript Input
              </button>
              <button
                onClick={() => setActiveTab("audio")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer",
                  activeTab === "audio"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <Mic className="w-3.5 h-3.5" />
                Audio Recording
              </button>
            </div>

            {activeTab === "transcript" ? (
              <TranscriptPaste meetingId={demoMeetingId} />
            ) : (
              <AudioUpload meetingId={demoMeetingId} />
            )}
          </div>

          {/* Right Column: AI Assistant Chat */}
          <div>
            <MeetingChatPanel meetingId={demoMeetingId} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
