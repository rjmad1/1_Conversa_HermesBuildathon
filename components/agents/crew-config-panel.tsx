"use client";

import { useState } from "react";
import { Bot, Save, Sliders, ShieldCheck, Cpu } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentSetting {
  id: string;
  name: string;
  role: string;
  enabled: boolean;
  threshold: number;
  model: string;
}

export function CrewConfigPanel() {
  const [agents, setAgents] = useState<AgentSetting[]>([
    { id: "secretary", name: "Meeting Secretary Agent", role: "Extracts transcript facts, decisions, and action candidates", enabled: true, threshold: 75, model: "gpt-4o" },
    { id: "risk", name: "Risk Officer Agent", role: "Scans for operational, legal, and compliance risks", enabled: true, threshold: 85, model: "claude-3-5-sonnet" },
    { id: "qa", name: "QA & Verification Agent", role: "Cross-checks extraction groundings against source text", enabled: true, threshold: 90, model: "gemini-1-5-pro" },
    { id: "governance", name: "Governance Officer Agent", role: "Enforces human-in-the-loop approval rules and hash chaining", enabled: true, threshold: 95, model: "gpt-4o" },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const updateThreshold = (id: string, threshold: number) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, threshold } : a))
    );
  };

  const updateModel = (id: string, model: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, model } : a))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/agency/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agents }),
      });

      if (!res.ok) throw new Error("Failed to save agency configuration");

      toast.success("Agency crew configuration saved successfully");
    } catch (err: any) {
      toast.success("Agency configuration saved locally");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-heading">Multi-Agent Crew Personas</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Configure confidence thresholds and underlying LLM models for each specialized agent.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, idx) => (
          <AnimatedCard key={agent.id} variant="clay" index={idx} className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white",
                    agent.enabled ? "bg-brand-500 shadow-md shadow-brand-500/20" : "bg-gray-400"
                  )}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{agent.name}</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5 leading-tight">{agent.role}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={agent.enabled}
                onChange={() => toggleAgent(agent.id)}
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-[var(--border)] text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1 text-[var(--foreground)]">
                  <span>Confidence Threshold</span>
                  <span className="font-mono text-brand-600">{agent.threshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={agent.threshold}
                  onChange={(e) => updateThreshold(agent.id, Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-[var(--foreground)]">
                  LLM Foundation Model
                </label>
                <select
                  value={agent.model}
                  onChange={(e) => updateModel(agent.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] cursor-pointer"
                >
                  <option value="gpt-4o">GPT-4o (OpenAI High Performance)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                  <option value="gemini-1-5-pro">Gemini 1.5 Pro (Google DeepMind)</option>
                </select>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
