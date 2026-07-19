import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading">Meetings</h1>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors no-underline"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </Link>
        </div>

        <AnimatedCard variant="flat" index={0}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">No meetings yet</h3>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-sm">
              Create your first meeting to upload audio or paste a transcript for AI analysis.
            </p>
            <Link
              href="/meetings/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 transition-colors no-underline"
            >
              <Plus className="w-4 h-4" />
              Create Meeting
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
