/**
 * Public exports for the Interaction Intelligence Layer.
 */
export * from "./domain/domain-models";
export * from "./domain/events/domain-events";
export * from "./domain/ports/provider-ports";

export * from "./application/engines/workspace-session-memory-engine";
export * from "./application/engines/spatial-navigation-history-engine";
export * from "./application/engines/context-stack-engine";
export * from "./application/engines/entity-preview-engine";
export * from "./application/engines/universal-activity-engine";
export * from "./application/engines/ai-confidence-engine";
export * from "./application/engines/progressive-complexity-engine";
export * from "./application/engines/persona-engine";
export * from "./application/engines/workspace-dna-engine";
export * from "./application/engines/explainability-engine";

export * from "./application/facades/interaction-intelligence-facade";

export * from "./infrastructure/adapters/in-memory-adapters";
export * from "./infrastructure/adapters/convex-adapters";
export * from "./infrastructure/adapters/aegis-os-adapter";
