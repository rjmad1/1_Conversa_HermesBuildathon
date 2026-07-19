"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TranscriptPasteProps {
  meetingId: string;
}

export function TranscriptPaste({ meetingId }: TranscriptPasteProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please paste transcript text");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/meetings/${meetingId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "PASTE",
          content,
          language: "en",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit transcript");
      }

      toast.success("Transcript submitted successfully");
      router.push(`/meetings/${meetingId}/processing`);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AnimatedCard variant="flat" index={0} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Meeting Transcript Text
          </label>
          <textarea
            required
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste raw transcript or meeting notes here... e.g. [00:01] Alice: We agreed to launch the new authentication flow by Friday. Bob will handle database migrations."
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm font-mono border border-[var(--border)]",
              "bg-[var(--background)] text-[var(--foreground)]",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-y"
            )}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--muted)]">
            {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white",
              "bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
            )}
          >
            {isSubmitting ? "Submitting..." : "Analyze Transcript"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </AnimatedCard>
    </form>
  );
}
