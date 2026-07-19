"use client";

import { use } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AuditTimelineView } from "@/components/meetings/audit-timeline-view";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MeetingAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link
            href={`/meetings/${meetingId}/review`}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-active)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading">Cryptographic Audit Trail</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              Tamper-evident event log for meeting meeting-{meetingId.slice(0, 8)}
            </p>
          </div>
        </div>

        <AuditTimelineView meetingId={meetingId} />
      </div>
    </PageTransition>
  );
}
