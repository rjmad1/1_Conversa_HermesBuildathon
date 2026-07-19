"use client";

import { use, useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AudioUpload } from "@/components/meetings/audio-upload";
import { TranscriptPaste } from "@/components/meetings/transcript-paste";
import { Mic, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MeetingInputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);
  const [activeTab, setActiveTab] = useState<"audio" | "transcript">("audio");

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-heading">Meeting Content Input</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Upload an audio recording or paste an existing transcript for automated analysis.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] w-fit">
          <button
            onClick={() => setActiveTab("audio")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
              activeTab === "audio"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Mic className="w-4 h-4" />
            Audio Upload
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
              activeTab === "transcript"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <FileText className="w-4 h-4" />
            Paste Transcript
          </button>
        </div>

        {/* Content */}
        {activeTab === "audio" ? (
          <AudioUpload meetingId={meetingId} />
        ) : (
          <TranscriptPaste meetingId={meetingId} />
        )}
      </div>
    </PageTransition>
  );
}
