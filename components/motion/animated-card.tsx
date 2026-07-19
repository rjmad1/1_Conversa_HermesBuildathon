"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/lib/design-tokens";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  /** Index in a list for stagger delay */
  index?: number;
  /** Card style variant */
  variant?: "clay" | "flat" | "glass";
}

export function AnimatedCard({
  children,
  index = 0,
  variant = "flat",
  className,
  ...props
}: AnimatedCardProps) {
  const cardClass =
    variant === "clay"
      ? "clay-card"
      : variant === "glass"
        ? "glass-card"
        : "flat-card";

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: variant === "clay" ? -4 : -2, transition: { duration: 0.2 } }}
      className={cn(cardClass, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
