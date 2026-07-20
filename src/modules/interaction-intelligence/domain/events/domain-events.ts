/**
 * Strongly typed domain event contracts for the Interaction Intelligence Layer.
 */
import type {
  WorkspaceSessionMemory,
  WorkspaceSnapshot,
  ContextFrame,
  EntityPreviewData,
  ActivityItem,
  AIArtifactExplanation,
  CapabilityLevel,
  PersonaType,
  DNARecommendation,
  ExplainabilityTrace,
} from "../domain-models";

export const INTERACTION_INTELLIGENCE_EVENTS = {
  // Session Memory
  SESSION_MEMORY_UPDATED: "intelligence.session.memory_updated",
  PANE_STATE_CHANGED: "intelligence.session.pane_state_changed",
  CAMERA_MOVED: "intelligence.session.camera_moved",

  // Spatial Navigation
  SNAPSHOT_CAPTURED: "intelligence.spatial.snapshot_captured",
  SNAPSHOT_RESTORED: "intelligence.spatial.snapshot_restored",
  TRAIL_SAVED: "intelligence.spatial.trail_saved",

  // Context Stack
  CONTEXT_FRAME_PUSHED: "intelligence.context.frame_pushed",
  CONTEXT_FRAME_POPPED: "intelligence.context.frame_popped",
  CONTEXT_STACK_RESET: "intelligence.context.stack_reset",

  // Entity Preview
  PREVIEW_REQUESTED: "intelligence.preview.requested",
  PREVIEW_PINNED: "intelligence.preview.pinned",
  PREVIEW_UNPINNED: "intelligence.preview.unpinned",

  // Universal Activity
  ACTIVITY_LOGGED: "intelligence.activity.logged",
  ACTIVITY_STREAM_UPDATED: "intelligence.activity.stream_updated",

  // AI Confidence & Governance
  CONFIDENCE_EVALUATED: "intelligence.ai.confidence_evaluated",
  GOVERNANCE_CHECKED: "intelligence.ai.governance_checked",

  // Progressive Complexity
  COMPLEXITY_LEVEL_CHANGED: "intelligence.complexity.level_changed",

  // Persona
  PERSONA_SWITCHED: "intelligence.persona.switched",

  // Workspace DNA
  DNA_RECOMMENDATION_GENERATED: "intelligence.dna.recommendation_generated",
  DNA_RECOMMENDATION_RESOLVED: "intelligence.dna.recommendation_resolved",

  // Explainability
  EXPLAINABILITY_TRACE_CREATED: "intelligence.explainability.trace_created",
} as const;

export interface SessionMemoryUpdatedPayload {
  session: WorkspaceSessionMemory;
}

export interface SnapshotCapturedPayload {
  snapshot: WorkspaceSnapshot;
}

export interface ContextFramePushedPayload {
  frame: ContextFrame;
  stackDepth: number;
}

export interface EntityPreviewRequestedPayload {
  preview: EntityPreviewData;
}

export interface ActivityLoggedPayload {
  activity: ActivityItem;
}

export interface AIConfidenceEvaluatedPayload {
  explanation: AIArtifactExplanation;
}

export interface ComplexityLevelChangedPayload {
  newLevel: CapabilityLevel;
  previousLevel: CapabilityLevel;
}

export interface PersonaSwitchedPayload {
  newPersona: PersonaType;
}

export interface DNARecommendationGeneratedPayload {
  recommendation: DNARecommendation;
}

export interface ExplainabilityTraceCreatedPayload {
  trace: ExplainabilityTrace;
}
