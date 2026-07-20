"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Search, Command, Sparkles, X, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { AmbientAuraPulse } from "@/components/motion/cognitive-motion";

interface CommandSurfaceProps {
  onOpenPalette?: () => void;
}

export function CommandSurface({ onOpenPalette }: CommandSurfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestedActions, setSuggestedActions] = useState([
    "Summarize Q3 Architecture decisions",
    "Assign 3 open risks to Lead Engineer",
    "Run OWASP Security Audit Agent",
  ]);

  const handleMicClick = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="pointer-events-auto command-surface-glass p-2 relative overflow-hidden"
      >
        {/* Expanded Recording Audio Waveform Surface */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 80, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center justify-center border-b border-white/10 mb-2 pb-2"
            >
              <div className="flex items-center gap-1.5 h-8">
                {[0.4, 0.9, 0.6, 1.2, 0.8, 0.4, 1.0, 0.7, 0.5, 0.9].map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: [height * 0.5, height * 1.5, height * 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.08,
                    }}
                    className="w-1 bg-cyan-400 rounded-full h-full"
                  />
                ))}
              </div>
              <p className="text-xs text-cyan-300 font-mono mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" /> Live Ambient Listening — Talk to Task...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Command Input Dock */}
        <div className="flex items-center gap-3 px-3 py-1.5">
          <AmbientAuraPulse active={true}>
            <button
              onClick={onOpenPalette}
              className="p-2 rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
              title="Open Universal Command Surface (Cmd+K)"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </button>
          </AmbientAuraPulse>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Conversa, execute agent action, or press Cmd+K..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && query) {
                setQuery("");
              }
            }}
          />

          {/* Quick Voice Mic Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleMicClick}
            className={`p-2 rounded-full transition-all ${
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20"
            }`}
            title={isRecording ? "Stop Voice Recording" : "Start Voice Talk-to-Task"}
          >
            <Mic className="w-4 h-4" />
          </motion.button>

          {/* Shortcut Pill */}
          <button
            onClick={onOpenPalette}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>

        {/* Ambient Predictive Suggestions Tray */}
        {query === "" && !isRecording && (
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 overflow-x-auto no-scrollbar border-t border-white/5">
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-cyan-400" /> Next:
            </span>
            {suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setQuery(action)}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/15 text-muted hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 whitespace-nowrap transition-all flex items-center gap-1"
              >
                <span>{action}</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
