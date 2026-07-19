"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  Bot,
  Plug,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_ITEMS = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Meetings", href: "/meetings", icon: Mic },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Tools", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-[var(--card)]/95 backdrop-blur-md",
        "border-t border-[var(--border)]",
        "safe-area-bottom"
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg",
                "text-[10px] font-medium no-underline transition-colors duration-200",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-[var(--muted)] active:text-[var(--foreground)]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
