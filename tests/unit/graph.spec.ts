import { describe, it, expect, beforeEach } from "vitest";
import { GraphEdge } from "../../src/modules/graph/domain/entities/edge";
import { InMemoryGraphRepository } from "../../src/modules/graph/infrastructure/in-memory-repository";
import { InMemoryKnowledgeRepository } from "../../src/modules/knowledge/repository";
import { GraphValidationService } from "../../src/modules/graph/application/validation-service";
import { TraversalEngine } from "../../src/modules/graph/application/traversal-engine";
import { GraphQueryService } from "../../src/modules/graph/application/query-service";
import { GraphQueryBuilder } from "../../src/modules/graph/domain/query-ast";
import { WorkspaceGraphService } from "../../src/modules/graph/application/graph-service";
import { VisualizationLayoutAdapters } from "../../src/modules/graph/visualization/layout-adapters";
import { GraphEventDispatcher } from "../../src/modules/graph/domain/events/graph-events";
import type { RelationshipTypeConfig } from "../../src/modules/graph/domain/types";

describe("Knowledge Graph Platform — Unit Test Suite", () => {
  const tenantId = "tenant_test";
  const workspaceId = "ws_test";
  const userId = "user_test";

  let graphRepo: InMemoryGraphRepository;
  let knowledgeRepo: InMemoryKnowledgeRepository;
  let validationService: GraphValidationService;
  let traversalEngine: TraversalEngine;
  let queryService: GraphQueryService;
  let graphService: WorkspaceGraphService;

  beforeEach(() => {
    GraphEventDispatcher.clear();
    graphRepo = new InMemoryGraphRepository();
    knowledgeRepo = new InMemoryKnowledgeRepository();

    const relConfigs = new Map<string, RelationshipTypeConfig>();
    relConfigs.set("DependsOn", {
      id: "rc_1",
      tenantId,
      workspaceId,
      code: "DependsOn",
      name: "Depends On",
      allowedSourceTypes: ["Task", "Project"],
      allowedTargetTypes: ["Task", "Project"],
      cardinality: "N:M",
      allowCycles: false, // Strict DAG
      allowSelfReference: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    relConfigs.set("Parent", {
      id: "rc_2",
      tenantId,
      workspaceId,
      code: "Parent",
      name: "Parent Item",
      allowedSourceTypes: ["*"],
      allowedTargetTypes: ["*"],
      cardinality: "N:1", // Max 1 parent
      allowCycles: false,
      allowSelfReference: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    validationService = new GraphValidationService(graphRepo, knowledgeRepo, relConfigs);
    traversalEngine = new TraversalEngine(graphRepo, knowledgeRepo);
    queryService = new GraphQueryService(traversalEngine, knowledgeRepo);
    graphService = new WorkspaceGraphService(graphRepo, validationService, traversalEngine, knowledgeRepo);
  });

  describe("1. GraphEdge Domain Aggregate", () => {
    it("should instantiate and update metadata", () => {
      const edge = GraphEdge.create({
        tenantId,
        workspaceId,
        sourceId: "node_A",
        targetId: "node_B",
        relationType: "DependsOn",
        createdBy: userId,
        metadata: { confidence: 0.9 },
      });

      expect(edge.id).toBeDefined();
      expect(edge.version).toBe(1);
      expect(edge.metadata?.confidence).toBe(0.9);

      edge.updateMetadata({ confidence: 0.95, verifiedBy: "user_2" }, userId);
      expect(edge.version).toBe(2);
      expect(edge.metadata?.confidence).toBe(0.95);
      expect(edge.metadata?.verifiedBy).toBe("user_2");
    });
  });

  describe("2. Repository Layer Operations & Backlinks", () => {
    it("should create, find, and resolve backlinks", async () => {
      await graphRepo.createEdge({
        tenantId,
        workspaceId,
        sourceId: "task_1",
        targetId: "task_2",
        relationType: "DependsOn",
        createdBy: userId,
      });

      const edges = await graphRepo.findEdges({ tenantId, workspaceId, sourceId: "task_1" });
      expect(edges).toHaveLength(1);
      expect(edges[0]!.targetId).toBe("task_2");

      const backlinks = await graphRepo.resolveBacklinks(tenantId, workspaceId, "task_2");
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0]!.sourceId).toBe("task_1");
    });
  });

  describe("3. Policy-Driven Validation Engine", () => {
    it("should block cycle creation for DAG relationship types", async () => {
      // Save test objects in knowledgeRepo
      await knowledgeRepo.save({ id: "task_A", tenantId, workspaceId, type: "Task", title: "Task A", properties: {}, metadata: {}, labels: [], relationships: [], createdBy: userId, updatedBy: userId, createdAt: 1000, updatedAt: 1000, status: "active", visibility: "Workspace", version: 1 });
      await knowledgeRepo.save({ id: "task_B", tenantId, workspaceId, type: "Task", title: "Task B", properties: {}, metadata: {}, labels: [], relationships: [], createdBy: userId, updatedBy: userId, createdAt: 1000, updatedAt: 1000, status: "active", visibility: "Workspace", version: 1 });
      await knowledgeRepo.save({ id: "task_C", tenantId, workspaceId, type: "Task", title: "Task C", properties: {}, metadata: {}, labels: [], relationships: [], createdBy: userId, updatedBy: userId, createdAt: 1000, updatedAt: 1000, status: "active", visibility: "Workspace", version: 1 });

      // Create A -> B -> C
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "task_A", targetId: "task_B", relationType: "DependsOn", createdBy: userId });
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "task_B", targetId: "task_C", relationType: "DependsOn", createdBy: userId });

      // Attempting C -> A must be blocked by TopologyCyclePolicy
      const res = await validationService.validateEdgeCreation(tenantId, workspaceId, {
        tenantId,
        workspaceId,
        sourceId: "task_C",
        targetId: "task_A",
        relationType: "DependsOn",
        createdBy: userId,
      });

      expect(res.valid).toBe(false);
      expect(res.errors[0]!.code).toBe("CYCLIC_RELATIONSHIP_PROHIBITED");
    });
  });

  describe("4. Traversal Engine & Shortest Path", () => {
    it("should perform BFS traversal and find shortest path", async () => {
      // Chain: 1 -> 2 -> 3 -> 4
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "node_1", targetId: "node_2", relationType: "References", createdBy: userId });
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "node_2", targetId: "node_3", relationType: "References", createdBy: userId });
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "node_3", targetId: "node_4", relationType: "References", createdBy: userId });

      const subgraph = await traversalEngine.traverse({
        tenantId,
        workspaceId,
        startNodeId: "node_1",
        strategy: "BFS",
        maxDepth: 3,
      });

      expect(subgraph.edges).toHaveLength(3);

      const pathResult = await traversalEngine.findShortestPath(tenantId, workspaceId, "node_1", "node_4");
      expect(pathResult.found).toBe(true);
      expect(pathResult.depth).toBe(3);
      expect(pathResult.pathNodes).toEqual(["node_1", "node_2", "node_3", "node_4"]);
    });
  });

  describe("5. Graph Query API & AST Executor", () => {
    it("should compile AST and execute graph queries", async () => {
      await graphRepo.createEdge({ tenantId, workspaceId, sourceId: "proj_1", targetId: "task_1", relationType: "Contains", createdBy: userId });

      const ast = GraphQueryBuilder.init(tenantId, workspaceId)
        .fromNode("proj_1")
        .viaRelations(["Contains"])
        .maxDepth(2)
        .buildAst();

      const result = await queryService.executeQuery(ast);
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]!.targetId).toBe("task_1");
    });
  });

  describe("6. WorkspaceGraphService Façade & Domain Events", () => {
    it("should emit EdgeCreated and BacklinksUpdated domain events", async () => {
      await knowledgeRepo.save({ id: "doc_1", tenantId, workspaceId, type: "Document", title: "Doc 1", properties: {}, metadata: {}, labels: [], relationships: [], createdBy: userId, updatedBy: userId, createdAt: 1000, updatedAt: 1000, status: "active", visibility: "Workspace", version: 1 });
      await knowledgeRepo.save({ id: "doc_2", tenantId, workspaceId, type: "Document", title: "Doc 2", properties: {}, metadata: {}, labels: [], relationships: [], createdBy: userId, updatedBy: userId, createdAt: 1000, updatedAt: 1000, status: "active", visibility: "Workspace", version: 1 });

      const eventsCaptured: any[] = [];
      const unsub = GraphEventDispatcher.subscribe((evt) => {
        eventsCaptured.push(evt);
      });

      const { edge } = await graphService.connectObjects({
        tenantId,
        workspaceId,
        sourceId: "doc_1",
        targetId: "doc_2",
        relationType: "References",
        createdBy: userId,
      });

      expect(edge).toBeDefined();
      expect(eventsCaptured.length).toBeGreaterThanOrEqual(2);
      expect(eventsCaptured.some((e) => e.type === "EdgeCreated")).toBe(true);
      expect(eventsCaptured.some((e) => e.type === "BacklinksUpdated")).toBe(true);

      unsub();
    });
  });

  describe("7. Visualization Layout Adapters", () => {
    it("should convert subgraph into Force Graph and Timeline payloads", async () => {
      await knowledgeRepo.save({
        id: "n1",
        tenantId,
        workspaceId,
        type: "Task",
        title: "Initial Task",
        properties: {},
        metadata: {},
        labels: [],
        relationships: [],
        createdBy: userId,
        updatedBy: userId,
        createdAt: 1000,
        updatedAt: 1000,
        status: "active",
        visibility: "Workspace",
        version: 1,
      });

      const subgraph = await traversalEngine.traverse({
        tenantId,
        workspaceId,
        startNodeId: "n1",
        includeNodes: true,
      });

      const forcePayload = VisualizationLayoutAdapters.toForceGraph(subgraph);
      expect(forcePayload.layout).toBe("force");
      expect(forcePayload.nodes).toHaveLength(1);
      expect(forcePayload.nodes[0]!.label).toBe("Initial Task");

      const timelinePayload = VisualizationLayoutAdapters.toTimeline(subgraph);
      expect(timelinePayload.layout).toBe("timeline");
      expect(timelinePayload.nodes[0]!.timestamp).toBe(1000);
    });
  });
});
