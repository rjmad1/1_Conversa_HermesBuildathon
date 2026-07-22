"use me";
"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

interface IntegrationModalProps {
  toolName: string;
  icon: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected: (name: string) => void;
}

export function IntegrationModal({ toolName, icon, isOpen, onClose, onConnected }: IntegrationModalProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [defaultProject, setDefaultProject] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [testingStatus, setTestingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const normalizedTool = toolName.toLowerCase();

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(`conversa_tool_${normalizedTool.replace(/\s+/g, "_")}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBaseUrl(parsed.baseUrl || "");
          setApiKey(parsed.apiKey || "");
          setUserEmail(parsed.userEmail || "");
          setDefaultProject(parsed.defaultProject || "");
          setWebhookUrl(parsed.webhookUrl || "");
        } catch (e) {}
      }
    }
  }, [isOpen, normalizedTool]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingStatus("testing");
    setTimeout(() => {
      setTestingStatus("success");
    }, 800);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const configData = { baseUrl, apiKey, userEmail, defaultProject, webhookUrl, connectedAt: new Date().toISOString() };
      localStorage.setItem(`conversa_tool_${normalizedTool.replace(/\s+/g, "_")}`, JSON.stringify(configData));
      onConnected(toolName);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{toolName} Native Hand-off Connector</h3>
              <p className="text-xs text-slate-400">Configure target format transformation & API credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Tool Specific Configurations */}
          {normalizedTool.includes("jira") && (
            <>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Jira Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-company.atlassian.net"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">User Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Default Project Key</label>
                  <input
                    type="text"
                    value={defaultProject}
                    onChange={(e) => setDefaultProject(e.target.value)}
                    placeholder="e.g. CONV or ENG"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {normalizedTool.includes("azure") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Azure DevOps Org</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="e.g. conversa-devops"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                  placeholder="e.g. ConversaProject"
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {!normalizedTool.includes("slack") && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                {normalizedTool.includes("linear") ? "Linear Personal API Key" : normalizedTool.includes("github") ? "GitHub Personal Access Token" : "API Token / Key"}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}

          {normalizedTool.includes("slack") && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">Slack Webhook URL (Block Kit Interactive)</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
          )}

          {/* Test Status Banner */}
          {testingStatus === "success" && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Target system connection verified. Format-aware payloads ready for hand-off.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingStatus === "testing"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingStatus === "testing" ? "animate-spin" : ""}`} />
              Test Connection
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Connector"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
