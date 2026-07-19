"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  "meetings": "Meetings",
  "new": "New Meeting",
  "workspace": "AI Workspace",
  "agents": "Agents",
  "control": "Control",
  "runs": "Runs",
  "workflows": "Workflows",
  "integrations": "Integrations",
  "analytics": "Analytics",
  "intelligence": "Competitive Intelligence",
  "settings": "Settings",
  "waitlist": "Waitlist",
  "input": "Input",
  "processing": "Processing",
  "review": "Review",
  "audit": "Audit Timeline",
};

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  let currentPath = "";

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-xs text-[var(--muted)]", className)}>
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {segments.map((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label =
          ROUTE_LABELS[segment] ||
          (segment.length > 10 ? `${segment.slice(0, 8)}…` : segment);

        return (
          <span key={currentPath} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)] opacity-50" />
            {isLast ? (
              <span className="font-semibold text-[var(--foreground)]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={currentPath}
                className="hover:text-[var(--foreground)] transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
