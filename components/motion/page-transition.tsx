"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/design-tokens";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}
