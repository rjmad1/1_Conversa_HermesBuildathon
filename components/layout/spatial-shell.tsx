"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layout,
  Network,
  Bot,
  Layers,
  ChevronRight,
  Plus,
  Sparkles,
  Search,
  CheckCircle,
  FileText,
  SlidersHorizontal,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { SpatialPaneMotion, GhostPillMotion } from "@/components/motion/cognitive-motion";

export interface WorkspaceNode {
  id: string;
  title: string;
  type: "document" | "meeting" | "task" | "agent";
  supertags: string[];
  content: string;
  updatedAt: string;
}

const SAMPLE_NODES: WorkspaceNode[] = [
  {
    id: "node-1",
    title: "Conversa Architecture Specification",
    type: "document",
    supertags: ["#architecture", "#v0.3"],
    content: "The Workspace Operating System unifies knowledge graphs, meeting intelligence, and autonomous agents.",
    updatedAt: "2 mins ago",
  },
  {
    id: "node-2",
    title: "Product Strategy & Q3 Roadmap Sync",
    type: "meeting",
    supertags: ["#meeting", "#strategy"],
    content: "Key Decision: Adopt Adaptive Glass Intelligence aesthetic across desktop, tablet, and mobile.",
    updatedAt: "10 mins ago",
  },
  {
    id: "node-3",
    title: "Refactor Convex Graph Storage Layer",
    type: "task",
    supertags: ["#action-item", "#high-priority"],
    content: "Implement sub-50ms node retrieval with multi-tier Redis caching.",
    updatedAt: "1 hour ago",
  },
];

export function SpatialShell() {
  const [openPanes, setOpenPanes] = useState<WorkspaceNode[]>(SAMPLE_NODES.slice(0, 2));
  const [inspectorTab, setInspectorTab] = useState<"metadata" | "graph" | "agent">("agent");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const closePane = (id: string) => {
    setOpenPanes(openPanes.filter((p) => p.id !== id));
  };

  const openNodePane = (node: WorkspaceNode) => {
    if (!openPanes.find((p) => p.id === node.id)) {
      setOpenPanes([...openPanes, node]);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Primary Spatial Workspace (Multi-Column Sliding Panes) */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto no-scrollbar items-stretch">
        <AnimatePresence mode="popLayout">
          {openPanes.map((pane, index) => (
            <SpatialPaneMotion
              key={pane.id}
              paneId={pane.id}
              className="flex-1 min-w-[380px] max-w-[650px] flex flex-col adaptive-glass"
            >
              {/* Spatial Pane Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface-1/40">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-semibold truncate text-foreground">{pane.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex gap-1 mr-2">
                    {pane.supertags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => closePane(pane.id)}
                    className="p-1 rounded hover:bg-white/10 text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spatial Pane Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <p className="text-sm text-foreground/90 leading-relaxed">{pane.content}</p>

                {/* Ambient AI Ghost Action Suggestion */}
                <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ambient Suggestion
                    </span>
                    <GhostPillMotion text="Generate Execution Graph" />
                  </div>
                  <p className="text-xs text-muted">
                    Conversa detected 2 downstream task dependencies for this document.
                  </p>
                </div>

                {/* Sub-node Connection Links */}
                <div className="border-t border-border/30 pt-3 space-y-2">
                  <span className="text-xs font-mono text-muted uppercase">Connected Context Nodes</span>
                  <div className="grid gap-2">
                    {SAMPLE_NODES.filter((n) => n.id !== pane.id).map((node) => (
                      <button
                        key={node.id}
                        onClick={() => openNodePane(node)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground group-hover:text-cyan-300 transition-colors">
                            {node.title}
                          </p>
                          <span className="text-[10px] text-muted">{node.updatedAt}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-cyan-300 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SpatialPaneMotion>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic Right Context Inspector Pane */}
      {isInspectorOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-80 border-l border-border/40 adaptive-glass flex flex-col m-4 ml-0"
        >
          {/* Inspector Header Tabs */}
          <div className="flex items-center justify-between border-b border-border/40 p-2">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setInspectorTab("agent")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  inspectorTab === "agent" ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-foreground"
                }`}
              >
                <Bot className="w-3.5 h-3.5 inline mr-1" /> Agent
              </button>
              <button
                onClick={() => setInspectorTab("graph")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  inspectorTab === "graph" ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-foreground"
                }`}
              >
                <Network className="w-3.5 h-3.5 inline mr-1" /> Graph
              </button>
              <button
                onClick={() => setInspectorTab("metadata")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  inspectorTab === "metadata" ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" /> Metadata
              </button>
            </div>
          </div>

          {/* Inspector Content Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {inspectorTab === "agent" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                    Active Agent Trace
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                    96% Confidence
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-foreground">Indexed Meeting Audio</span>
                  </div>
                  <p className="text-[11px] text-muted">Extracted 3 decision nodes and assigned tasks.</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-medium text-foreground">Running Security Governance</span>
                  </div>
                  <p className="text-[11px] text-muted">Checking schema constraints before commit.</p>
                </div>
              </div>
            )}

            {inspectorTab === "graph" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                  Context Graph Visualization
                </h4>
                <div className="h-44 rounded-lg bg-surface-2 border border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-cyan-500/10 to-transparent" />
                  <p className="text-xs text-cyan-300 font-mono flex items-center gap-1 z-10">
                    <Network className="w-4 h-4" /> 5 Connected Nodes
                  </p>
                </div>
              </div>
            )}

            {inspectorTab === "metadata" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                  Supertags & Properties
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs py-1 border-b border-border/20">
                    <span className="text-muted">Created By</span>
                    <span className="text-foreground font-mono">Autonomous AI</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-border/20">
                    <span className="text-muted">Entity Type</span>
                    <span className="text-cyan-300 font-mono">WorkspaceNode</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
