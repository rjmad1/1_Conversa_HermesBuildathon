"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Main content area — offset by sidebar width */}
      <div className="md:ml-[var(--sidebar-width)] transition-[margin] duration-300">
        <TopBar onOpenCommandPalette={() => setCmdOpen(true)} />

        <main className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
