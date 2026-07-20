"use client";

import { useState } from "react";
import { CanonicalKnowledgeObject } from "@/src/shared/domain/types";
import { KnowledgeObjectRenderer } from "@/components/metadata/knowledge-object-renderer";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeExplorerProps {
  objects?: CanonicalKnowledgeObject[];
}

export function KnowledgeExplorer({ objects = [] }: KnowledgeExplorerProps) {
  const [filterType, setFilterType] = useState<string>("All");

  const filterOptions = ["All", "Meeting", "Task", "Document", "Prompt", "Decision"];

  const filteredObjects =
    filterType === "All"
      ? objects
      : objects.filter((o) => o.type === filterType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-heading">Knowledge Explorer</h2>
        <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-lg border border-[var(--border)] text-xs">
          {filterOptions.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                filterType === type
                  ? "bg-brand-500 text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {filteredObjects.length === 0 ? (
        <AnimatedCard className="p-8 text-center text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No knowledge objects found for filter &quot;{filterType}&quot;</p>
        </AnimatedCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredObjects.map((obj) => (
            <KnowledgeObjectRenderer key={obj.id} object={obj} />
          ))}
        </div>
      )}
    </div>
  );
}
