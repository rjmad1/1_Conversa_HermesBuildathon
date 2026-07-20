import type { StandardRelationshipType } from "../types";

export interface EdgeCreatedEvent {
  type: "EdgeCreated";
  tenantId: string;
  workspaceId: string;
  edgeId: string;
  sourceId: string;
  targetId: string;
  relationType: StandardRelationshipType;
  timestamp: number;
}

export interface EdgeDeletedEvent {
  type: "EdgeDeleted";
  tenantId: string;
  workspaceId: string;
  edgeId: string;
  sourceId: string;
  targetId: string;
  relationType: StandardRelationshipType;
  timestamp: number;
}

export interface RelationshipValidatedEvent {
  type: "RelationshipValidated";
  tenantId: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationType: StandardRelationshipType;
  valid: boolean;
  timestamp: number;
}

export interface BacklinksUpdatedEvent {
  type: "BacklinksUpdated";
  tenantId: string;
  workspaceId: string;
  targetId: string;
  count: number;
  timestamp: number;
}

export interface GraphTraversalCompletedEvent {
  type: "GraphTraversalCompleted";
  tenantId: string;
  workspaceId: string;
  startId: string;
  nodeCount: number;
  edgeCount: number;
  executionTimeMs: number;
  timestamp: number;
}

export type GraphDomainEvent =
  | EdgeCreatedEvent
  | EdgeDeletedEvent
  | RelationshipValidatedEvent
  | BacklinksUpdatedEvent
  | GraphTraversalCompletedEvent;

export type GraphEventListener = (event: GraphDomainEvent) => void | Promise<void>;

export class GraphEventDispatcher {
  private static listeners: GraphEventListener[] = [];

  static subscribe(listener: GraphEventListener): () => void {
    GraphEventDispatcher.listeners.push(listener);
    return () => {
      GraphEventDispatcher.listeners = GraphEventDispatcher.listeners.filter((l) => l !== listener);
    };
  }

  static async dispatch(event: GraphDomainEvent): Promise<void> {
    for (const listener of GraphEventDispatcher.listeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error("Error in graph event listener:", err);
      }
    }
  }

  static clear(): void {
    GraphEventDispatcher.listeners = [];
  }
}
