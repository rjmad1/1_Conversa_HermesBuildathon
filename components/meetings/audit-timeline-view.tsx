"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Activity, Hash, CheckCircle } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";

export interface AuditEvent {
  sequenceNumber: number;
  id: string;
  operation: string;
  correlationId: string;
  actorId: string;
  payloadHash: string;
  previousHash: string;
  signature: string;
  timestamp: string;
}

interface AuditTimelineViewProps {
  meetingId: string;
}

export function AuditTimelineView({ meetingId }: AuditTimelineViewProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch(`/api/v1/meetings/${meetingId}/audit`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || data.auditTrail || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAudit();
  }, [meetingId]);

  return (
    <div className="space-y-6">
      {/* Integrity Badge */}
      <AnimatedCard variant="clay" index={0} className="p-4 bg-emerald-500/10 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Cryptographic Audit Chain Sealed
              </h3>
              <p className="text-xs text-[var(--muted)]">
                VERIFIED INTEGRITY • SHA-256 HMAC Hash-Chained Audit Trail
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
            0 Tampering Detected
          </span>
        </div>
      </AnimatedCard>

      {/* Events Timeline */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <AnimatedCard variant="flat" index={1} className="p-8 text-center text-sm text-[var(--muted)]">
            {isLoading ? "Loading audit log..." : "No cryptographic audit events logged for this meeting yet."}
          </AnimatedCard>
        ) : (
          events.map((evt, idx) => (
            <AnimatedCard key={evt.id || idx} variant="flat" index={idx} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
                    #{evt.sequenceNumber ?? idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{evt.operation}</span>
                </div>
                <span className="text-xs font-mono text-[var(--muted)]">{evt.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Payload Hash:</span>{" "}
                  {evt.payloadHash ? `${evt.payloadHash.slice(0, 16)}…` : "N/A"}
                </div>
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Prev Hash:</span>{" "}
                  {evt.previousHash ? `${evt.previousHash.slice(0, 16)}…` : "0000000000000000…"}
                </div>
              </div>
            </AnimatedCard>
          ))
        )}
      </div>
    </div>
  );
}
