/**
 * Domain Models & Value Objects for the Interaction Intelligence Layer
 */

// 1. Workspace Session Memory
export interface PaneState {
  id: string;
  type: string;
  title: string;
  uri: string;
  isExpanded: boolean;
  activeFilterId?: string;
  scrollPosition?: { x: number; y: number };
}

export interface CameraPosition {
  x: number;
  y: number;
  zoom: number;
}

export interface InspectorState {
  isOpen: boolean;
  activeTab: string;
  focusedSectionId?: string;
  width: number;
}

export interface FilterState {
  query?: string;
  tags: string[];
  dateRange?: { start: string; end: string };
  status?: string[];
  customFilters: Record<string, unknown>;
}

export interface WorkspaceSessionMemory {
  sessionId: string;
  tenantId: string;
  workspaceId: string;
  userId: string;
  openPanes: PaneState[];
  activeEntityId?: string;
  graphCameraPosition: CameraPosition;
  selectedNodeIds: string[];
  expandedSectionIds: string[];
  activeFilters: FilterState;
  searchState: { query: string; activeCategory?: string };
  commandHistory: string[];
  inspectorState: InspectorState;
  aiConversationContextId?: string;
  splitLayout: {
    sidebarWidth: number;
    mainRatio: number;
    inspectorWidth: number;
    isSidebarCollapsed: boolean;
    isInspectorCollapsed: boolean;
  };
  lastUpdated: number;
}

// 2. Spatial Navigation History
export type NavigationNodeType =
  | "Workspace"
  | "Project"
  | "Meeting"
  | "Decision"
  | "Task"
  | "Graph"
  | "Document";

export interface NavigationNode {
  id: string;
  type: NavigationNodeType;
  title: string;
  uri: string;
  parentId?: string;
  entityId?: string;
  timestamp: number;
}

export interface WorkspaceSnapshot {
  snapshotId: string;
  workspaceId: string;
  activeEntityId?: string;
  activeNode: NavigationNode;
  paneState: PaneState[];
  contextStackId: string;
  graphViewport: CameraPosition;
  inspectorState: InspectorState;
  filters: FilterState;
  searchState: { query: string };
  commandContext?: string;
  aiContextId?: string;
  userFocus?: string;
  timestamp: number;
  version: number;
}

export interface SpatialTrail {
  trailId: string;
  name: string;
  snapshots: WorkspaceSnapshot[];
  createdAt: number;
}

export interface DeepLinkToken {
  token: string;
  workspaceId: string;
  primaryEntityId: string;
  snapshotId?: string;
  contextId?: string;
}

// 3. Context Stack
export type ContextLayerType =
  | "Meeting"
  | "Decision"
  | "Task"
  | "AI_Insight"
  | "Automation"
  | "Approval";

export interface ContextFrame {
  frameId: string;
  layerType: ContextLayerType;
  entityId: string;
  title: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  status: "active" | "suspended" | "completed";
}

export interface ContextStack {
  stackId: string;
  frames: ContextFrame[];
  activeFrameId: string;
  depth: number;
  updatedAt: number;
}

// 4. Entity Preview Engine
export type PreviewMode = "Hover" | "Peek" | "Expand" | "Pin" | "Open";

export interface RelationshipRef {
  targetId: string;
  targetType: string;
  relationshipType: string;
  title: string;
}

export interface OwnershipInfo {
  ownerId: string;
  ownerName: string;
  teamId?: string;
}

export interface EntityPreviewData {
  entityId: string;
  entityType: string;
  title: string;
  aiSummary?: string;
  metadata: Record<string, unknown>;
  relationships: RelationshipRef[];
  recentActivity: string[];
  ownership: OwnershipInfo;
  nextActions: string[];
  linkedEntityIds: string[];
  confidenceScore: number;
  status: string;
  mode: PreviewMode;
  isPinned: boolean;
  fetchedAt: number;
}

// 5. Universal Activity Layer
export type ActivityKind =
  | "AI_Job"
  | "Agent_Execution"
  | "Import"
  | "Sync"
  | "Background_Indexing"
  | "Automation"
  | "Integration"
  | "Notification"
  | "Error"
  | "Pending_Approval";

export type ActivityPriority = "Critical" | "High" | "Normal" | "Low";

export interface ActivityItem {
  id: string;
  timestamp: number;
  kind: ActivityKind;
  priority: ActivityPriority;
  title: string;
  description: string;
  actorId?: string;
  source: string;
  payload?: Record<string, unknown>;
  status: "queued" | "running" | "completed" | "failed" | "pending";
  confidenceScore?: number;
}

export interface ActivityStream {
  streamId: string;
  items: ActivityItem[];
  unreadCount: number;
  lastUpdated: number;
}

// 6. AI Confidence & Explainability
export type ConfidenceBand = "High" | "Recommended" | "Review" | "Exploratory";

export interface ProvenanceTrace {
  sourceId: string;
  sourceType: string;
  reasoningSummary: string;
  verificationStatus: "verified" | "unverified" | "disputed";
  approvalState: "approved" | "pending" | "rejected";
  timestamp: number;
}

export interface AIArtifactExplanation {
  artifactId: string;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  provenance: ProvenanceTrace[];
  reasoningSummary: string;
  verificationStatus: "verified" | "unverified" | "disputed";
  approvalState: "approved" | "pending" | "rejected";
  isGovernanceCompliant: boolean;
}

// 7. Progressive Complexity Engine
export type CapabilityLevel =
  | "Starter"
  | "Professional"
  | "PowerUser"
  | "Administrator"
  | "Enterprise";

export interface CapabilityFeatureGate {
  level: CapabilityLevel;
  enabledFeatures: string[];
  userOverrides: Record<string, boolean>;
}

// 8. Adaptive Workspace Personas
export type PersonaType =
  | "Executive"
  | "Product"
  | "Engineering"
  | "Sales"
  | "CustomerSuccess"
  | "Operations"
  | "Research";

export interface PersonaConfig {
  personaType: PersonaType;
  navigationDefaults: string[];
  layoutDefaults: string;
  defaultDashboards: string[];
  shortcutPresets: string[];
  aiSuggestionModes: string[];
}

// 9. Workspace DNA Engine
export interface InitiativePattern {
  name: string;
  frequency: number;
  lastActive: number;
}

export interface WorkingStyleMetric {
  primaryCategory: string;
  activeHoursPeak: string;
  preferredView: string;
}

export interface DNARecommendation {
  id: string;
  category: "Layout" | "Shortcut" | "Automation" | "View" | "Search";
  title: string;
  explanation: string;
  confidenceScore: number;
  payload: Record<string, unknown>;
  status: "proposed" | "accepted" | "dismissed" | "snoozed";
  createdAt: number;
}

export interface WorkspaceDNA {
  workspaceId: string;
  activeInitiatives: InitiativePattern[];
  workingStyle: WorkingStyleMetric;
  commonEntityIds: string[];
  frequentlyLinkedKnowledge: string[];
  preferredLayoutId: string;
  automationHabits: string[];
  meetingPatterns: string[];
  graphEvolutionMetrics: { nodeCount: number; edgeCount: number; growthRate: number };
  workspacePriorities: string[];
  recommendations: DNARecommendation[];
  updatedAt: number;
}

// 10. Explainability Engine
export interface AdaptiveReason {
  question: "WhyAppeared" | "WhyRecommended" | "WhyPrioritized";
  explanation: string;
  evidence: string[];
  sourceEngine: string;
  impact: string;
  canUndo: boolean;
}

export interface ExplainabilityTrace {
  id: string;
  targetId: string;
  reason: AdaptiveReason;
  confidenceScore: number;
  timestamp: number;
}
