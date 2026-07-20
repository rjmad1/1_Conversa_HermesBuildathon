export type StandardRelationshipType =
  | "Parent"
  | "Child"
  | "References"
  | "ReferencedBy"
  | "DependsOn"
  | "RequiredBy"
  | "AssignedTo"
  | "OwnedBy"
  | "CreatedBy"
  | "GeneratedFrom"
  | "RelatedTo"
  | "DuplicateOf"
  | "Blocks"
  | "BlockedBy"
  | "Contains"
  | "MemberOf"
  | "TaggedWith"
  | string;

export type RelationshipCardinality = "1:1" | "1:N" | "N:1" | "N:M";

export interface RelationshipTypeConfig {
  id: string;
  tenantId: string;
  workspaceId: string;
  code: string;
  name: string;
  inverseCode?: string;
  description?: string;
  allowedSourceTypes: string[];
  allowedTargetTypes: string[];
  cardinality?: RelationshipCardinality;
  allowCycles?: boolean;
  allowSelfReference?: boolean;
  metadataSchema?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdgeData {
  id: string;
  tenantId: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationType: StandardRelationshipType;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  status: "active" | "archived";
}

export interface CreateGraphEdgeInput {
  tenantId: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationType: StandardRelationshipType;
  metadata?: Record<string, any>;
  createdBy: string;
}

export interface UpdateGraphEdgeInput {
  id: string;
  metadata?: Record<string, any>;
  status?: "active" | "archived";
  updatedBy: string;
}
