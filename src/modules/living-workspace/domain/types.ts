/**
 * Living Workspace Layer - Domain Types & Models
 */

// --- 1. Living Knowledge Graph Domain Models ---

export interface GraphNodeRef {
  id: string;
  type: string;
  title: string;
  metadata?: Record<string, unknown>;
  lastUpdatedAt: number;
  confidenceScore: number;
  ownerId?: string;
}

export interface RelationshipConfidence {
  edgeId: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  confidenceScore: number; // 0.0 to 1.0
  reasoningSummary: string;
  provenance: {
    source: string;
    verifiedBy?: string;
    timestamp: number;
  };
}

export interface SemanticCluster {
  clusterId: string;
  name: string;
  topic: string;
  nodeIds: string[];
  centroidKeywords: string[];
  densityScore: number;
}

export interface GraphHealthMetrics {
  totalNodes: number;
  totalEdges: number;
  orphanCount: number;
  duplicateCount: number;
  staleCount: number;
  brokenCount: number;
  graphHealthScore: number; // 0-100
}

export interface TemporalRelationship {
  edgeId: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  validFrom: number;
  validTo?: number;
  sequenceOrder?: number;
}

export interface AIDiscoveredRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  suggestedRelationType: string;
  confidenceScore: number;
  rationale: string;
  evidence: string[];
  provenanceSource: string;
  status: "proposed" | "approved" | "rejected";
  createdAt: number;
}

export interface OrphanNode {
  nodeId: string;
  nodeType: string;
  title: string;
  isolatedSince: number;
  suggestedConnections: { targetId: string; relationType: string; confidence: number }[];
}

export interface DuplicateEntityCandidate {
  entityIdA: string;
  entityIdB: string;
  entityType: string;
  similarityScore: number;
  matchingAttributes: string[];
  mergeRecommendationId?: string;
}

export interface StaleKnowledgeItem {
  entityId: string;
  entityType: string;
  title: string;
  lastModifiedAt: number;
  daysInactive: number;
  decayScore: number; // 0.0 (fresh) to 1.0 (dead)
}

export interface GraphEvolutionRecord {
  recordId: string;
  timestamp: number;
  eventType: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
  metadata?: Record<string, unknown>;
}


// --- 2. Workspace Timeline Domain Models ---

export type TimelineEventType =
  | "meeting"
  | "ai_analysis"
  | "decision"
  | "task"
  | "approval"
  | "automation"
  | "graph_change"
  | "metadata_edit"
  | "import"
  | "export"
  | "integration"
  | "agent_execution"
  | "governance_action";

export interface TimelineEvent {
  id: string;
  workspaceId: string;
  tenantId: string;
  timestamp: number;
  eventType: TimelineEventType;
  category: string;
  actorId: string;
  actorType: "user" | "system" | "agent" | "ai";
  summary: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  snapshotId?: string;
}

export interface TimelineFilter {
  workspaceId: string;
  eventTypes?: TimelineEventType[];
  startDate?: number;
  endDate?: number;
  entityId?: string;
  actorId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface TimelineSnapshot {
  snapshotId: string;
  workspaceId: string;
  timestamp: number;
  eventCount: number;
  stateSummary: Record<string, unknown>;
  milestoneName: string;
}

export interface ActivitySummary {
  workspaceId: string;
  totalEvents: number;
  categoryBreakdown: Record<string, number>;
  topActors: { actorId: string; count: number }[];
  timePeriod: { start: number; end: number };
}


// --- 3. Workspace Health Engine Domain Models ---

export type HealthDomain =
  | "KnowledgeQuality"
  | "ExecutionHealth"
  | "AIHealth"
  | "Governance"
  | "Collaboration"
  | "Performance";

export type HealthStatus = "Excellent" | "Healthy" | "AttentionNeeded" | "AtRisk" | "Critical";

export interface DomainHealthScore {
  domain: HealthDomain;
  score: number; // 0 - 100
  status: HealthStatus;
  metrics: Record<string, number>;
  keyIssues: string[];
}

export interface WorkspaceHealthScore {
  workspaceId: string;
  overallScore: number; // 0 - 100
  status: HealthStatus;
  domains: Record<HealthDomain, DomainHealthScore>;
  updatedAt: number;
  trend: "improving" | "stable" | "declining";
}


// --- 4. Recommendation Engine Domain Models ---

export type RecommendationCategory =
  | "MissingOwner"
  | "MissingMetadata"
  | "DuplicateKnowledge"
  | "MergeCandidates"
  | "SuggestedRelationships"
  | "AutomationOpportunities"
  | "WorkflowImprovements"
  | "KnowledgeGaps"
  | "SuggestedTemplates"
  | "SuggestedDashboards"
  | "SuggestedSavedViews"
  | "SuggestedSearches"
  | "SuggestedGraphLinks";

export type RecommendationApprovalState =
  | "Generated"
  | "Explained"
  | "PolicyEvaluated"
  | "AwaitingApproval"
  | "Approved"
  | "Executing"
  | "Completed"
  | "Rejected"
  | "RolledBack";

export interface Recommendation {
  id: string;
  workspaceId: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  rationale: string;
  evidence: string[];
  impact: "High" | "Medium" | "Low";
  confidenceScore: number; // 0.0 to 1.0
  canUndo: boolean;
  approvalState: RecommendationApprovalState;
  targetEntityId?: string;
  payload: Record<string, unknown>;
  policyRequiredApproval: boolean;
  createdAt: number;
  updatedAt: number;
}


// --- 5. Workspace Evolution Engine Domain Models ---

export interface PatternMetric {
  name: string;
  frequency: number;
  lastObserved: number;
}

export interface WorkspaceDNAMetrics {
  workingPatterns: PatternMetric[];
  layoutUsage: PatternMetric[];
  meetingStructures: PatternMetric[];
  recurringWorkflows: PatternMetric[];
  metadataConventions: PatternMetric[];
  graphEvolutionRate: number;
  teamCollaborationPatterns: PatternMetric[];
}

export type EvolutionProposalCategory =
  | "ReusableTemplate"
  | "WorkspaceView"
  | "GraphTaxonomy"
  | "AutomationRule"
  | "SavedSearch"
  | "NavigationShortcut"
  | "DashboardUpdate";

export interface WorkspaceEvolutionProposal {
  id: string;
  workspaceId: string;
  category: EvolutionProposalCategory;
  title: string;
  rationale: string;
  evidence: string[];
  confidenceScore: number;
  isReversible: boolean;
  status: "proposed" | "accepted" | "rejected" | "applied";
  payload: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
