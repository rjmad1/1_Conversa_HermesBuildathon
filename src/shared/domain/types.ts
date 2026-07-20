export type KnowledgeObjectType =
  | "Workspace"
  | "Collection"
  | "Meeting"
  | "Task"
  | "Decision"
  | "Person"
  | "Project"
  | "Document"
  | "Reference"
  | "Template"
  | "Attachment"
  | "Conversation"
  | "Prompt"
  | "View";

export type VisibilityLevel = "Private" | "Workspace" | "Public";

export interface RelationshipLink {
  targetId: string;
  relationType: string;
}

export interface CanonicalKnowledgeObject<TProperties = Record<string, any>> {
  id: string;
  type: KnowledgeObjectType;
  tenantId: string;
  workspaceId: string;
  title: string;
  summary?: string;
  body?: string;
  properties: TProperties;
  metadata: Record<string, any>;
  labels: string[];
  relationships: RelationshipLink[];
  source?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  visibility: VisibilityLevel;
  aiContext?: Record<string, any>;
  executionMetadata?: Record<string, any>;
  version: number;
}

// Domain Value Objects & Interfaces
export interface SearchQuery {
  tenantId: string;
  workspaceId: string;
  query?: string;
  types?: KnowledgeObjectType[];
  labels?: string[];
  status?: string;
  limit?: number;
}
