"use client";

import React from "react";
import type { CanonicalKnowledgeObject } from "@/src/shared/domain/types";
import type { ResolvedObjectTypeSchema } from "@/src/modules/metadata/domain/types";
import { AnimatedCard } from "@/components/motion/animated-card";
import { FieldRenderer } from "./registries/field-registry";
import { FileText, Calendar, CheckSquare, Sparkles, Tag, Shield, Layers } from "lucide-react";

interface KnowledgeObjectRendererProps {
  object: CanonicalKnowledgeObject;
  schema?: ResolvedObjectTypeSchema;
}

const TYPE_ICONS: Record<string, any> = {
  Meeting: Calendar,
  Task: CheckSquare,
  Document: FileText,
  Prompt: Sparkles,
};

export function KnowledgeObjectRenderer({ object, schema }: KnowledgeObjectRendererProps) {
  const Icon = TYPE_ICONS[object.type] || Layers;

  const properties = object.properties || {};
  const fields = schema ? Array.from(schema.fields.values()) : [];

  return (
    <AnimatedCard className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3 hover:border-brand-500/50 transition-colors">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
            style={schema?.color ? { color: schema.color } : undefined}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--foreground)]">{object.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span>{schema?.name || object.type}</span>
              {schema?.inheritanceChain && schema.inheritanceChain.length > 1 && (
                <span className="text-[10px] font-mono opacity-60">
                  ({schema.inheritanceChain.join(" > ")})
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--muted)]/10 text-[var(--muted)]">
          v{object.version}
        </span>
      </div>

      {/* Summary */}
      {object.summary && (
        <p className="text-xs text-[var(--muted)] line-clamp-2">{object.summary}</p>
      )}

      {/* Dynamic Metadata Properties */}
      {fields.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
          {fields.map((field) => (
            <div key={field.key} className="space-y-0.5">
              <span className="text-[10px] font-medium text-[var(--muted)] block uppercase tracking-wider">
                {field.name}
              </span>
              <FieldRenderer field={field} value={properties[field.key]} readOnly />
            </div>
          ))}
        </div>
      ) : (
        // Fallback key-value renderer if schema is loading
        Object.keys(properties).length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]">
            {Object.entries(properties).map(([k, v]) => (
              <div key={k} className="space-y-0.5">
                <span className="text-[10px] font-medium text-[var(--muted)] block capitalize">{k}</span>
                <span className="text-xs text-[var(--foreground)] font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Footer / Labels / Visibility */}
      <div className="flex items-center gap-2 pt-2 text-[10px] text-[var(--muted)] border-t border-[var(--border)]">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {object.visibility}
        </span>
        {object.labels.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {object.labels.join(", ")}
          </span>
        )}
      </div>
    </AnimatedCard>
  );
}
