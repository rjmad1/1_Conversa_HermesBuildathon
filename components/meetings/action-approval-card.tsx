"use client";

import { useState } from "react";
import { Check, X, ExternalLink, ShieldAlert, User, Calendar } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ProposedActionItem {
  id: string;
  description: string;
  ownerName?: string;
  dueDate?: string;
  status: "PROPOSED" | "APPROVED" | "REJECTED";
  groundingLinks?: { title: string; url: string }[];
  requiresApproval?: boolean;
}

interface ActionApprovalCardProps {
  meetingId: string;
  action: ProposedActionItem;
  onStatusChange?: (actionId: string, newStatus: "APPROVED" | "REJECTED") => void;
}

export function ActionApprovalCard({ meetingId, action, onStatusChange }: ActionApprovalCardProps) {
  const [status, setStatus] = useState<"PROPOSED" | "APPROVED" | "REJECTED">(action.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/v1/actions/${action.id}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to approve action");

      setStatus("APPROVED");
      toast.success("Action approved & dispatched to connected tools");
      if (onStatusChange) onStatusChange(action.id, "APPROVED");
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/v1/actions/${action.id}/reject`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reject action");

      setStatus("REJECTED");
      toast.info("Action rejected");
      if (onStatusChange) onStatusChange(action.id, "REJECTED");
    } catch (err: any) {
      toast.error(err.message || "Rejection failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatedCard
      variant="flat"
      className={cn(
        "p-4 space-y-3 transition-all duration-200",
        status === "APPROVED"
          ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
          : status === "REJECTED"
          ? "border-red-200 bg-red-50/20 dark:border-red-900 dark:bg-red-950/10 opacity-70"
          : "border-[var(--border)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--foreground)] flex-1">{action.description}</p>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0",
            status === "APPROVED"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
              : status === "REJECTED"
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
          )}
        >
          {status}
        </span>
      </div>

      {/* Owner & Due date */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
        {action.ownerName && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-brand-500" />
            {action.ownerName}
          </span>
        )}
        {action.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            {action.dueDate}
          </span>
        )}
      </div>

      {/* Grounding links */}
      {action.groundingLinks && action.groundingLinks.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            Grounding References
          </p>
          <div className="flex flex-wrap gap-2">
            {action.groundingLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                {link.title}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {status === "PROPOSED" && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleReject}
            disabled={isUpdating}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isUpdating}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Approve & Dispatch
          </button>
        </div>
      )}
    </AnimatedCard>
  );
}
