"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LottiePlayerProps {
  /** Title or descriptive label */
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LottiePlayer({ label = "Processing...", className, size = "md" }: LottiePlayerProps) {
  const sizeMap = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-36 h-36",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4 gap-3", className)}>
      <div className={cn("relative flex items-center justify-center", sizeMap[size])}>
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/40"
        />
        {/* Inner pulse circle */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-1/2 rounded-full bg-brand-500/20 backdrop-blur-md"
        />
        {/* Core dot */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
        />
      </div>
      {label && <p className="text-xs font-medium text-[var(--muted)] animate-pulse">{label}</p>}
    </div>
  );
}
