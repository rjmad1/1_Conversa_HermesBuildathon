"use client";

import { useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { IntegrationModal } from "@/components/integrations/integration-modal";
import { Plug, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS = [
  { name: "Linear", icon: "🛠️", desc: "Sync actions to engineering backlogs" },
  { name: "Jira", icon: "📋", desc: "Export action items to Jira projects" },
  { name: "GitHub", icon: "🐙", desc: "Create issues in repositories" },
  { name: "Slack", icon: "💬", desc: "Publish meeting digests to channels" },
  { name: "HubSpot", icon: "🤝", desc: "Automate CRM follow-ups" },
  { name: "Google Calendar", icon: "📅", desc: "Schedule event placeholders" },
  { name: "Outlook", icon: "📧", desc: "Schedule Outlook events" },
  { name: "Claude Code", icon: "🤖", desc: "Push to Claude Code workspace" },
  { name: "Cursor", icon: "💻", desc: "Expose actions in Cursor IDE" },
  { name: "Gemini", icon: "🌟", desc: "Trigger Gemini AI pipelines" },
  { name: "Codex", icon: "🧠", desc: "Leverage Codex task parsing" },
  { name: "Lovable", icon: "❤️", desc: "Push to Lovable workspace" },
  { name: "MCP Protocol", icon: "⚡", desc: "Connect to MCP servers" },
  { name: "Direct API", icon: "🔗", desc: "Send JSON webhook payloads" },
];

export default function IntegrationsPage() {
  const [connectedTools, setConnectedTools] = useState<string[]>(["Slack", "GitHub"]);
  const [activeTool, setActiveTool] = useState<{ name: string; icon: string } | null>(null);

  const handleConnected = (toolName: string) => {
    if (!connectedTools.includes(toolName)) {
      setConnectedTools((prev) => [...prev, toolName]);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Integrations & Connectors</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Connect external tools to automatically dispatch approved meeting actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {connectedTools.length} / {TOOLS.length} connected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => {
            const isConnected = connectedTools.includes(tool.name);

            return (
              <AnimatedCard
                key={tool.name}
                variant={isConnected ? "clay" : "flat"}
                index={i}
                onClick={() => setActiveTool({ name: tool.name, icon: tool.icon })}
                className={cn(
                  "cursor-pointer transition-all duration-200 border p-5",
                  isConnected
                    ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-[var(--border)] hover:border-brand-400"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{tool.icon}</span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Configure
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold">{tool.name}</h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{tool.desc}</p>
              </AnimatedCard>
            );
          })}
        </div>

        {activeTool && (
          <IntegrationModal
            toolName={activeTool.name}
            icon={activeTool.icon}
            isOpen={!!activeTool}
            onClose={() => setActiveTool(null)}
            onConnected={handleConnected}
          />
        )}
      </div>
    </PageTransition>
  );
}
