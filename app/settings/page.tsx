"use client";

import { useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Settings, Key, Shield, Globe, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("conversa_openai_key") || "" : ""
  );
  const [linkupKey, setLinkupKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("conversa_linkup_key") || "" : ""
  );
  const [workspaceName, setWorkspaceName] = useState("Default Workspace");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("conversa_openai_key", openaiKey);
        localStorage.setItem("conversa_linkup_key", linkupKey);
      }
      toast.success("Settings & API keys saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-heading">Settings & Workspace Config</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage API credentials (BYOK), workspace parameters, and tenant isolation options.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* BYOK Section */}
          <AnimatedCard variant="clay" index={0} className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Key className="w-5 h-5 text-brand-500" />
              <h2 className="text-base font-bold font-heading">Bring Your Own Key (BYOK)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  OpenAI API Key (GPT-4o & Whisper)
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl text-xs font-mono border border-[var(--border)]",
                    "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500"
                  )}
                />
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Your key is saved locally in browser storage and injected into API requests via headers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Linkup Web Grounding API Key
                </label>
                <input
                  type="password"
                  value={linkupKey}
                  onChange={(e) => setLinkupKey(e.target.value)}
                  placeholder="lk_..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl text-xs font-mono border border-[var(--border)]",
                    "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500"
                  )}
                />
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Enables real-time web search grounding for action claims. Fallbacks to mock grounding if blank.
                </p>
              </div>
            </div>
          </AnimatedCard>

          {/* Workspace Settings */}
          <AnimatedCard variant="flat" index={1} className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Globe className="w-5 h-5 text-brand-500" />
              <h2 className="text-base font-bold font-heading">Workspace & Tenant Identity</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border border-[var(--border)]",
                    "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500"
                  )}
                />
              </div>

              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--muted)]">TENANT ID</span>
                  <span className="font-bold">tenant-demo</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--muted)]">WORKSPACE ID</span>
                  <span className="font-bold">workspace-demo</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--muted)]">SECURITY MODE</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Strict Tenant Scoped</span>
                </div>
              </div>
            </div>
          </AnimatedCard>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
