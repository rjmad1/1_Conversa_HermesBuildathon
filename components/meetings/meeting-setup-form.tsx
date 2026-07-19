"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Calendar, FileText, ArrowRight } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function MeetingSetupForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("CEREMONY");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          meetingType,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await res.json();
      const meetingId = data.meeting?.id || data.id;
      toast.success("Meeting created successfully");
      router.push(`/meetings/${meetingId}/input`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <AnimatedCard variant="clay" index={0} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Meeting Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Weekly Product Architecture & Governance Review"
            className={cn(
              "w-full px-4 py-3 rounded-xl text-sm border border-[var(--border)]",
              "bg-[var(--background)] text-[var(--foreground)]",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Meeting Category
            </label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm border border-[var(--border)]",
                "bg-[var(--background)] text-[var(--foreground)] cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
              )}
            >
              <option value="CEREMONY">Ceremony (Sprint Planning / Retrospective)</option>
              <option value="ONE_ON_ONE">1-on-1 Sync</option>
              <option value="ALL_HANDS">All Hands / Town Hall</option>
              <option value="DESIGN_REVIEW">Design / Architecture Review</option>
              <option value="INCIDENT">Incident Post-Mortem</option>
              <option value="CUSTOM">Custom Strategy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Scheduled Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm border border-[var(--border)]",
                  "bg-[var(--background)] text-[var(--foreground)]",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                )}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white",
              "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700",
              "shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
            )}
          >
            {isSubmitting ? "Creating..." : "Continue to Input"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </AnimatedCard>
    </form>
  );
}
