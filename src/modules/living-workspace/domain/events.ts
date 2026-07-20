/**
 * Living Workspace Layer - Event Contracts
 */

export const LIVING_WORKSPACE_EVENTS = {
  RECOMMENDATION_GENERATED: "living_workspace.recommendation.generated",
  RECOMMENDATION_POLICY_EVALUATED: "living_workspace.recommendation.policy_evaluated",
  RECOMMENDATION_APPROVED: "living_workspace.recommendation.approved",
  RECOMMENDATION_EXECUTED: "living_workspace.recommendation.executed",
  RECOMMENDATION_ROLLED_BACK: "living_workspace.recommendation.rolled_back",
  HEALTH_SCORE_UPDATED: "living_workspace.health.updated",
  GRAPH_EVOLVED: "living_workspace.graph.evolved",
  TIMELINE_EVENT_RECORDED: "living_workspace.timeline.event_recorded",
  EVOLUTION_PROPOSED: "living_workspace.evolution.proposed",
} as const;

export interface RecommendationGeneratedPayload {
  recommendationId: string;
  workspaceId: string;
  category: string;
  title: string;
  confidenceScore: number;
  impact: string;
}

export interface RecommendationApprovedPayload {
  recommendationId: string;
  workspaceId: string;
  approverId: string;
  approvedAt: number;
}

export interface RecommendationExecutedPayload {
  recommendationId: string;
  workspaceId: string;
  executedAt: number;
  resultingEventIds: string[];
}

export interface HealthScoreUpdatedPayload {
  workspaceId: string;
  overallScore: number;
  status: string;
  previousScore?: number;
  timestamp: number;
}

export interface GraphEvolvedPayload {
  workspaceId: string;
  addedEdgesCount: number;
  clusterCount: number;
  healthScore: number;
  timestamp: number;
}

export interface TimelineEventRecordedPayload {
  workspaceId: string;
  eventId: string;
  eventType: string;
  actorId: string;
  timestamp: number;
}

export interface EvolutionProposedPayload {
  proposalId: string;
  workspaceId: string;
  category: string;
  title: string;
  confidenceScore: number;
}
