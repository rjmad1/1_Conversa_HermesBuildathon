"use client";

import { useState } from "react";
import { X, Key, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IntegrationModalProps {
  toolName: string;
  icon: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected: (name: string) => void;
}

export function IntegrationModal({ toolName, icon, isOpen, onClose, onConnected }: IntegrationModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Store in localStorage or API
      localStorage.setItem(`conversa_tool_${toolName.toLowerCase().replace(/\s+/g, "_")}`, JSON.stringify({ apiKey, webhookUrl }));
      toast.success(`${toolName} configured and connected!`);
      onConnected(toolName);
      onClose();
    } catch (err) {
      toast.error("Failed to save integration settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-bold font-heading">{toolName} Integration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--foreground)] mb-1">API Token / OAuth Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. sk_live_..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--foreground)] mb-1">Webhook Dispatch Endpoint (Optional)</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-transparent hover:bg-[var(--sidebar-active)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-colors cursor-pointer"
            >
              {isSaving ? "Saving..." : "Connect Tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
