import type { GraphEdgeData, CreateGraphEdgeInput, StandardRelationshipType } from "../types";

export class GraphEdge implements GraphEdgeData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: StandardRelationshipType;
  metadata?: Record<string, any>;
  readonly createdBy: string;
  updatedBy: string;
  readonly createdAt: number;
  updatedAt: number;
  version: number;
  status: "active" | "archived";

  constructor(data: GraphEdgeData) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.workspaceId = data.workspaceId;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.relationType = data.relationType;
    this.metadata = data.metadata ? { ...data.metadata } : undefined;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.version = data.version;
    this.status = data.status;
  }

  static create(input: CreateGraphEdgeInput, generateId?: () => string): GraphEdge {
    const now = Date.now();
    const id = generateId ? generateId() : `edge_${now}_${Math.random().toString(36).substring(2, 9)}`;
    return new GraphEdge({
      id,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      sourceId: input.sourceId,
      targetId: input.targetId,
      relationType: input.relationType,
      metadata: input.metadata,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    });
  }

  updateMetadata(metadata: Record<string, any>, updatedBy: string): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedBy = updatedBy;
    this.updatedAt = Date.now();
    this.version += 1;
  }

  archive(updatedBy: string): void {
    this.status = "archived";
    this.updatedBy = updatedBy;
    this.updatedAt = Date.now();
    this.version += 1;
  }

  toJSON(): GraphEdgeData {
    return {
      id: this.id,
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      sourceId: this.sourceId,
      targetId: this.targetId,
      relationType: this.relationType,
      metadata: this.metadata ? { ...this.metadata } : undefined,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      status: this.status,
    };
  }
}
