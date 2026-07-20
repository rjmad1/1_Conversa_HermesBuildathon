"use client";

import React from "react";
import type { FieldDefinition } from "@/src/modules/metadata/domain/types";
import { Calendar, CheckSquare, Hash, Link as LinkIcon, Mail, Tag, Type, User } from "lucide-react";

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange?: (value: any) => void;
  readOnly?: boolean;
}

export function TextFieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  return readOnly ? (
    <span className="text-xs font-medium text-[var(--foreground)]">{value ?? "—"}</span>
  ) : (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={field.displayOptions?.placeholder || `Enter ${field.name}...`}
      className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-transparent focus:outline-hidden focus:border-brand-500"
    />
  );
}

export function NumberFieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  return readOnly ? (
    <span className="text-xs font-mono text-[var(--foreground)]">{value ?? "—"}</span>
  ) : (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange?.(parseFloat(e.target.value))}
      className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-transparent focus:outline-hidden focus:border-brand-500"
    />
  );
}

export function SelectFieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  const options = field.constraints?.options || [];
  return readOnly ? (
    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
      {value ?? "None"}
    </span>
  ) : (
    <select
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
    >
      <option value="">Select option...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function DateFieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  return readOnly ? (
    <span className="text-xs text-[var(--muted)] flex items-center gap-1">
      <Calendar className="w-3 h-3 text-brand-500" />
      {value ? new Date(value).toLocaleDateString() : "No date"}
    </span>
  ) : (
    <input
      type="date"
      value={value ? new Date(value).toISOString().split("T")[0] : ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-transparent"
    />
  );
}

export function TagFieldRenderer({ value }: FieldRendererProps) {
  const tags: string[] = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300">
          #{t}
        </span>
      ))}
    </div>
  );
}

export function ReferenceFieldRenderer({ value }: FieldRendererProps) {
  return (
    <span className="text-xs text-brand-500 flex items-center gap-1 underline cursor-pointer">
      <LinkIcon className="w-3 h-3" />
      {value ? `Ref: ${String(value).slice(0, 12)}...` : "Unlinked"}
    </span>
  );
}

const FIELD_RENDERERS: Record<string, React.FC<FieldRendererProps>> = {
  Text: TextFieldRenderer,
  Number: NumberFieldRenderer,
  Currency: NumberFieldRenderer,
  Select: SelectFieldRenderer,
  Date: DateFieldRenderer,
  DateTime: DateFieldRenderer,
  Tag: TagFieldRenderer,
  MultiSelect: TagFieldRenderer,
  Reference: ReferenceFieldRenderer,
};

export function FieldRenderer(props: FieldRendererProps) {
  const Component = FIELD_RENDERERS[props.field.type] || TextFieldRenderer;
  return <Component {...props} />;
}
