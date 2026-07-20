"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

// Framer Motion Spring & Easing Presets
export const SPRING_PRESETS = {
  spatial: { type: "spring" as const, stiffness: 300, damping: 28 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 22 },
  easeOut: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
};

// 1. Spatial Multi-Pane Sliding Wrapper
interface SpatialPaneProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  paneId: string;
}

export function SpatialPaneMotion({ children, paneId, className, ...props }: SpatialPaneProps) {
  return (
    <motion.div
      key={paneId}
      initial={{ opacity: 0, x: 32, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.97 }}
      transition={SPRING_PRESETS.spatial}
      className={`spatial-pane ${className || ""}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 2. Command Surface Floating Dock Reveal
export function CommandSurfaceMotion({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={SPRING_PRESETS.snappy}
      className={`command-surface-glass ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}

// 3. Ambient AI Status Ring Aura Pulse
export function AmbientAuraPulse({ active = true, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={
        active
          ? {
              boxShadow: [
                "0 0 10px 1px rgba(34, 211, 238, 0.2)",
                "0 0 24px 4px rgba(34, 211, 238, 0.55)",
                "0 0 10px 1px rgba(34, 211, 238, 0.2)",
              ],
            }
          : {}
      }
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className="relative inline-flex items-center justify-center rounded-full"
    >
      {children}
    </motion.div>
  );
}

// 4. Inline Ghost Action Pill Reveal
export function GhostPillMotion({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING_PRESETS.snappy}
      onClick={onClick}
      className="ghost-pill"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      <span>{text}</span>
      <span className="text-[10px] opacity-60 ml-0.5">Tab ↵</span>
    </motion.button>
  );
}
