"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Sun, Moon, Monitor, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/meetings": "Meetings",
  "/meetings/new": "New Meeting",
  "/workspace": "AI Workspace",
  "/agents": "Agents",
  "/agents/control": "Agency Control",
  "/agents/runs": "Agent Runs",
  "/workflows": "Workflows",
  "/integrations": "Integrations",
  "/analytics": "Analytics",
  "/intelligence": "Competitive Intelligence",
  "/settings": "Settings",
  "/waitlist": "Waitlist",
};

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // Handle dynamic routes
  if (pathname.startsWith("/meetings/") && pathname.includes("/review")) return "Meeting Review";
  if (pathname.startsWith("/meetings/") && pathname.includes("/input")) return "Meeting Input";
  if (pathname.startsWith("/meetings/") && pathname.includes("/processing")) return "Processing";
  if (pathname.startsWith("/meetings/") && pathname.includes("/audit")) return "Audit Timeline";
  if (pathname.startsWith("/agents/runs/")) return "Run Trace";
  return "Conversa";
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";

  for (const segment of segments) {
    path += `/${segment}`;
    const title = ROUTE_TITLES[path];
    if (title) {
      crumbs.push({ label: title, href: path });
    } else {
      // For dynamic segments like UUIDs, show truncated
      const label = segment.length > 8 ? `${segment.slice(0, 8)}…` : segment;
      crumbs.push({ label, href: path });
    }
  }

  return crumbs;
}

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const breadcrumbs = getBreadcrumbs(pathname);
  const title = getPageTitle(pathname);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const themeIcon =
    theme === "dark" ? <Moon className="w-4 h-4" /> :
    theme === "light" ? <Sun className="w-4 h-4" /> :
    <Monitor className="w-4 h-4" />;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-14 flex items-center justify-between px-6",
        "bg-[var(--background)]/80 backdrop-blur-md",
        "border-b border-[var(--border)]"
      )}
    >
      {/* Left: Breadcrumbs + Title */}
      <div className="flex items-center gap-3">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-xs text-[var(--muted)]">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbs.length - 1 ? "text-[var(--foreground)] font-medium" : ""}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-lg font-bold font-heading sm:hidden">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search / Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
            "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]",
            "hover:border-brand-300 hover:text-[var(--foreground)]",
            "transition-colors duration-200 cursor-pointer"
          )}
          aria-label="Open command palette"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline text-[10px] bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className={cn(
            "p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]",
            "hover:bg-[var(--sidebar-active)] transition-colors duration-200",
            "cursor-pointer border-none bg-transparent"
          )}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className={cn(
            "p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]",
            "hover:bg-[var(--sidebar-active)] transition-colors duration-200",
            "cursor-pointer border-none bg-transparent"
          )}
          aria-label={`Current theme: ${theme}. Click to change.`}
        >
          {themeIcon}
        </button>
      </div>
    </header>
  );
}
