"use client";

import { useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { SpatialShell } from "@/components/layout/spatial-shell";
import { CommandSurface } from "@/components/layout/command-surface";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileWorkspace } from "@/components/layout/mobile-workspace";
import { KnowledgeExplorer } from "@/components/knowledge/knowledge-explorer";

export default function WorkspacePage() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-background overflow-hidden">
        {/* Desktop & Tablet Adaptive Spatial Workspace */}
        <div className="hidden md:block h-screen">
          <SpatialShell />
        </div>

        {/* Mobile Experience (Tana-inspired mobile outliner + gesture sheets + talk dock) */}
        <div className="md:hidden">
          <MobileWorkspace />
        </div>

        {/* Omnipresent Floating Command Surface */}
        <CommandSurface onOpenPalette={() => setCommandPaletteOpen(true)} />

        {/* Universal Command Palette (Cmd+K) */}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </div>
    </PageTransition>
  );
}
