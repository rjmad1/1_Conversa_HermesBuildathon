"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Mic,
  BrainCircuit,
  Bot,
  Workflow,
  Plug,
  BarChart3,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarWidths, motion as motionTokens } from "@/lib/design-tokens";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Meetings", href: "/meetings", icon: Mic },
  { label: "AI Workspace", href: "/workspace", icon: BrainCircuit },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Intelligence", href: "/intelligence", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? sidebarWidths.collapsed : sidebarWidths.expanded;

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easeOut }}
      className={cn(
        "fixed top-0 left-0 z-40 h-screen flex flex-col",
        "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
        "hidden md:flex"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[var(--sidebar-border)]">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            C
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: motionTokens.duration.fast }}
                className="font-heading text-lg font-bold text-[var(--foreground)] whitespace-nowrap overflow-hidden"
              >
                Conversa
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-colors duration-200 no-underline relative",
                isActive
                  ? "bg-[var(--sidebar-active)] text-brand-600 dark:text-brand-400"
                  : "text-[var(--muted)] hover:bg-[var(--sidebar-active)] hover:text-[var(--foreground)]"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-500"
                  transition={{ type: "spring", ...motionTokens.spring }}
                />
              )}

              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive
                    ? "text-brand-500"
                    : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                )}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: motionTokens.duration.fast }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge && !collapsed && (
                <span className="ml-auto text-xs bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[var(--sidebar-border)]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl",
            "text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]",
            "hover:bg-[var(--sidebar-active)] transition-colors duration-200",
            "cursor-pointer border-none bg-transparent"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
