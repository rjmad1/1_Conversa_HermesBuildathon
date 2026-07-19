"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Mic,
  Plus,
  Bot,
  Plug,
  Shield,
  Settings,
  Search,
  BarChart3,
  BrainCircuit,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  category: string;
  keywords?: string;
}

const COMMANDS: CommandItem[] = [
  // Pages
  { label: "Dashboard", href: "/", icon: LayoutDashboard, category: "Pages" },
  { label: "Meetings", href: "/meetings", icon: Mic, category: "Pages" },
  { label: "AI Workspace", href: "/workspace", icon: BrainCircuit, category: "Pages" },
  { label: "Agents", href: "/agents", icon: Bot, category: "Pages" },
  { label: "Agency Control", href: "/agents/control", icon: Bot, category: "Pages" },
  { label: "Agent Runs", href: "/agents/runs", icon: Bot, category: "Pages" },
  { label: "Workflows", href: "/workflows", icon: Workflow, category: "Pages" },
  { label: "Integrations", href: "/integrations", icon: Plug, category: "Pages" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, category: "Pages" },
  { label: "Competitive Intelligence", href: "/intelligence", icon: Shield, category: "Pages" },
  { label: "Settings", href: "/settings", icon: Settings, category: "Pages" },

  // Actions
  { label: "New Meeting", href: "/meetings/new", icon: Plus, category: "Actions", keywords: "create start" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const runCommand = useCallback(
    (href: string) => {
      onOpenChange(false);
      setSearch("");
      router.push(href);
    },
    [router, onOpenChange]
  );

  const grouped = COMMANDS.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    const list = acc[cmd.category] ?? [];
    list.push(cmd);
    acc[cmd.category] = list;
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className={cn(
                "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl",
                "overflow-hidden"
              )}
              label="Command palette"
            >
              {/* Search Input */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
                <Search className="w-4 h-4 text-[var(--muted)]" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className={cn(
                    "flex-1 py-3 text-sm bg-transparent outline-none border-none",
                    "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                  )}
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-[var(--muted)]">
                  No results found.
                </Command.Empty>

                {Object.entries(grouped).map(([category, items]) => (
                  <Command.Group
                    key={category}
                    heading={category}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {items.map((item) => (
                      <Command.Item
                        key={item.href}
                        value={`${item.label} ${item.keywords || ""}`}
                        onSelect={() => runCommand(item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer",
                          "text-[var(--foreground)] transition-colors duration-100",
                          "data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700",
                          "dark:data-[selected=true]:bg-brand-900/50 dark:data-[selected=true]:text-brand-300"
                        )}
                      >
                        <item.icon className="w-4 h-4 text-[var(--muted)]" />
                        {item.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
