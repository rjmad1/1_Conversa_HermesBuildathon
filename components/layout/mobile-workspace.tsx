"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, ChevronUp, Layers, CheckCircle2, FileText, Search, X } from "lucide-react";
import { AmbientAuraPulse } from "@/components/motion/cognitive-motion";

export function MobileWorkspace() {
  const [activeSheetOpen, setActiveSheetOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="md:hidden flex flex-col h-screen w-full bg-background relative overflow-hidden">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface-1/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <AmbientAuraPulse active={true}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </AmbientAuraPulse>
          <span className="font-semibold text-sm text-foreground">Conversa OS</span>
        </div>
        <button
          onClick={() => setActiveSheetOpen(true)}
          className="p-2 rounded-full bg-white/5 text-muted hover:text-foreground"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Main Outliner Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-mono uppercase text-cyan-400">Today's Ambient Intelligence</span>
          <p className="text-xs text-foreground font-medium">3 Action items extracted from Morning Strategy Audio.</p>
        </div>

        {/* Node Cards */}
        <div className="space-y-3">
          {[
            { title: "Product Roadmap Q3 Specs", tag: "#architecture", status: "Active Node" },
            { title: "Customer Advisory Board Notes", tag: "#meeting", status: "Captured" },
            { title: "Convex Multi-tier Cache Agent", tag: "#agent", status: "Running" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSheetOpen(true)}
              className="p-3.5 rounded-xl adaptive-glass flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-foreground">{item.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-cyan-300 font-mono">
                  {item.tag}
                </span>
              </div>
              <span className="text-[10px] text-muted font-mono">{item.status}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Floating Bottom Talk Dock */}
      <div className="p-3 bg-surface-1/80 border-t border-border/40 backdrop-blur-lg flex items-center justify-between gap-3">
        <button
          onClick={() => setActiveSheetOpen(true)}
          className="flex-1 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Ask Conversa...</span>
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsRecording(!isRecording)}
          className={`p-3 rounded-full ${
            isRecording ? "bg-red-500 text-white" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
          }`}
        >
          <Mic className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Layered Gesture Bottom Sheet */}
      <AnimatePresence>
        {activeSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[80vh] rounded-t-3xl adaptive-glass p-5 flex flex-col"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-foreground">Node Inspection & Context</h3>
                <button onClick={() => setActiveSheetOpen(false)} className="p-1 rounded text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                <p className="text-xs text-muted leading-relaxed">
                  Tana-inspired mobile outliner view enhanced with layered bottom sheets, gesture navigation, and offline Convex graph synchronization.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
