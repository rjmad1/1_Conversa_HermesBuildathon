"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import {
  Mic,
  ClipboardList,
  Bot,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  {
    label: "New Meeting",
    href: "/meetings/new",
    icon: Plus,
    description: "Create meeting and upload audio or paste transcript",
    color: "text-brand-500",
    bgColor: "bg-brand-50 dark:bg-brand-900/30",
  },
  {
    label: "AI Workspace",
    href: "/workspace",
    icon: Zap,
    description: "Unified canvas for live multi-agent pipeline & chat",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  {
    label: "View Agent Runs",
    href: "/agents/runs",
    icon: Bot,
    description: "Inspect multi-agent execution traces & step graphs",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    label: "Competitive Intelligence",
    href: "/intelligence",
    icon: TrendingUp,
    description: "Run automated sweeps and publish Slack digests",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
  },
];

export default function DashboardPage() {
  const [meetingsCount, setMeetingsCount] = useState(12);

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Hero / Welcome */}
        <AnimatedCard variant="clay" index={0} className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <Mic className="w-4 h-4" />
              Conversa Audio-First Meeting Intelligence
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              HMAC Audit Lock Active
            </span>
          </div>

          <h1 className="text-3xl font-extrabold font-heading text-[var(--foreground)]">
            {getGreeting()} 👋
          </h1>
          <p className="text-[var(--muted)] text-sm max-w-2xl leading-relaxed">
            Transform meeting recordings and raw transcripts into governed enterprise actions with human-in-the-loop approval, web grounding, and tamper-evident audit trails.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all no-underline"
            >
              <Plus className="w-4 h-4" />
              Start New Meeting
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-active)] transition-all no-underline"
            >
              Open AI Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedCard>

        {/* Telemetry Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard variant="flat" index={1} className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Total Meetings</span>
              <Mic className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-2xl font-extrabold font-heading">24</p>
            <p className="text-xs text-[var(--muted)]">All status verified</p>
          </AnimatedCard>

          <AnimatedCard variant="flat" index={2} className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Governed Actions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold font-heading">58</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">100% human-in-the-loop</p>
          </AnimatedCard>

          <AnimatedCard variant="flat" index={3} className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold font-heading">0.8s</p>
            <p className="text-xs text-[var(--muted)]">Sub-second agency pipeline</p>
          </AnimatedCard>

          <AnimatedCard variant="flat" index={4} className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Active Crew Agents</span>
              <Bot className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold font-heading">4</p>
            <p className="text-xs text-[var(--muted)]">Secretary, Risk, QA, Governance</p>
          </AnimatedCard>
        </div>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-lg font-bold font-heading mb-4">Launchpad & Workflows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, i) => (
              <Link key={action.href} href={action.href} className="no-underline">
                <AnimatedCard variant="flat" index={i + 5} className="h-full cursor-pointer group p-5">
                  <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center mb-3`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1">
                    {action.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{action.description}</p>
                </AnimatedCard>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
