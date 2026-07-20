import type { IntentCategory } from "../value-objects/intent";

export interface CommandManifest {
  id: string;
  name: string;
  category: IntentCategory;
  intentId?: string;
  description?: string;
  shortcut?: string;
  icon?: string;
  isUndoable?: boolean;
  providerId: string;
  executionMode?: "Sync" | "Async" | "Stream";
  enabledContexts?: string[];
  handler: (args?: Record<string, unknown>) => Promise<unknown>;
}
