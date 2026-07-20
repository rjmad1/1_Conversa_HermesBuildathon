import { describe, it, expect, beforeEach } from "vitest";
import { PlatformEventBus } from "../../src/platform/events";
import { LivingWorkspaceFacade } from "../../src/modules/living-workspace";

describe("Living Workspace Layer - Integrated Capabilities Unit Tests", () => {
  let eventBus: PlatformEventBus;
  let facade: LivingWorkspaceFacade;

  beforeEach(() => {
    eventBus = new PlatformEventBus();
    facade = new LivingWorkspaceFacade(eventBus);
  });

  describe("1. Living Knowledge Graph Capability", () => {
    it("detects orphan nodes, duplicate entities, and stale knowledge items", () => {
      // Register nodes
      facade.graphService.registerNode({
        id: "node_1",
        type: "Document",
        title: "Q3 Strategy RFC",
        lastUpdatedAt: Date.now() - 40 * 24 * 60 * 60 * 1000, // 40 days old (stale)
        confidenceScore: 0.9,
      });

      facade.graphService.registerNode({
        id: "node_2",
        type: "Document",
        title: "Q3 Strategy RFC", // Duplicate title & type
        lastUpdatedAt: Date.now(),
        confidenceScore: 0.85,
      });

      facade.graphService.registerNode({
        id: "node_3",
        type: "Task",
        title: "Implement Auth Flow",
        lastUpdatedAt: Date.now(),
        confidenceScore: 0.95,
      });

      // No edges registered yet -> all 3 are orphans
      const gaps = facade.detectKnowledgeGaps();
      expect(gaps.orphans.length).toBe(3);
      expect(gaps.duplicates.length).toBe(1);
      expect(gaps.duplicates[0]?.entityIdA).toBe("node_1");
      expect(gaps.duplicates[0]?.entityIdB).toBe("node_2");
      expect(gaps.staleItems.length).toBe(1);
      expect(gaps.staleItems[0]?.entityId).toBe("node_1");
    });

    it("proposes and approves AI-discovered relationships with confidence and provenance", () => {
      facade.graphService.registerNode({ id: "n1", type: "Meeting", title: "Sync", lastUpdatedAt: Date.now(), confidenceScore: 1.0 });
      facade.graphService.registerNode({ id: "n2", type: "Decision", title: "Architecture", lastUpdatedAt: Date.now(), confidenceScore: 1.0 });

      const proposal = facade.graphService.proposeAIDiscoveredRelationship(
        "n1",
        "n2",
        "GeneratedFrom",
        0.92,
        "Meeting transcript contains explicit decision statement",
        ["Transcript line 42"],
        "MeetingAnalysisAgent"
      );

      expect(proposal.status).toBe("proposed");
      expect(proposal.confidenceScore).toBe(0.92);

      const approvedRel = facade.graphService.approveAIDiscoveredRelationship(proposal.id, "usr_lead");
      expect(approvedRel).not.toBeNull();
      expect(approvedRel?.confidenceScore).toBe(0.92);
      expect(approvedRel?.provenance.verifiedBy).toBe("usr_lead");
    });
  });

  describe("2. Workspace Timeline Capability", () => {
    it("records immutable events, indexes by category/type, supports filtering and snapshots", () => {
      facade.recordTimelineEvent({
        workspaceId: "ws_alpha",
        tenantId: "tenant_1",
        eventType: "meeting",
        category: "Meeting",
        actorId: "usr_alice",
        actorType: "user",
        summary: "Sprint Planning Meeting",
      });

      facade.recordTimelineEvent({
        workspaceId: "ws_alpha",
        tenantId: "tenant_1",
        eventType: "task",
        category: "Execution",
        actorId: "usr_bob",
        actorType: "user",
        summary: "Created task: Database migration",
      });

      const events = facade.getTimelineEvents({ workspaceId: "ws_alpha" });
      expect(events.length).toBe(2);

      const filtered = facade.getTimelineEvents({ workspaceId: "ws_alpha", eventTypes: ["meeting"] });
      expect(filtered.length).toBe(1);
      expect(filtered[0]?.summary).toContain("Sprint Planning");

      const snapshot = facade.timelineService.createSnapshot("ws_alpha", "Milestone 1 Complete");
      expect(snapshot.eventCount).toBe(2);
      expect(snapshot.milestoneName).toBe("Milestone 1 Complete");
    });
  });

  describe("3. Workspace Health Engine Capability", () => {
    it("calculates overall workspace health (0-100) and domain-specific sub-scores", () => {
      const health = facade.recalculateWorkspaceHealth("ws_alpha");

      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(health.overallScore).toBeLessThanOrEqual(100);
      expect(health.domains.KnowledgeQuality).toBeDefined();
      expect(health.domains.ExecutionHealth).toBeDefined();
      expect(health.domains.AIHealth).toBeDefined();
      expect(health.domains.Governance).toBeDefined();
    });
  });

  describe("4. Recommendation Engine Capability", () => {
    it("generates explainable recommendations and enforces strict policy approval workflow prior to execution", () => {
      const rec = facade.recommendationService.generateRecommendation({
        workspaceId: "ws_alpha",
        category: "MissingOwner",
        title: "Assign owner to orphaned project specification",
        description: "Project spec has no owner.",
        rationale: "Unowned documents decrease knowledge health score.",
        evidence: ["Doc ID: spec_99"],
        impact: "High",
        confidenceScore: 0.94,
        policyRequiredApproval: true,
      });

      expect(rec.approvalState).toBe("AwaitingApproval");

      // Execution directly without approval must fail!
      expect(() => facade.executeRecommendation(rec.id)).toThrowError(/must be Approved before execution/);

      // Approve recommendation
      const approved = facade.approveRecommendation(rec.id, "mgr_charlie");
      expect(approved?.approvalState).toBe("Approved");

      // Now execution succeeds
      const executed = facade.executeRecommendation(rec.id);
      expect(executed?.approvalState).toBe("Completed");
    });

    it("supports rolling back completed recommendations", () => {
      const rec = facade.recommendationService.generateRecommendation({
        workspaceId: "ws_alpha",
        category: "SuggestedSavedViews",
        title: "Save Sprint View",
        description: "Save active sprint filter as a view",
        rationale: "Frequent navigation",
        evidence: ["Navigated 10x"],
        impact: "Low",
        confidenceScore: 0.85,
        canUndo: true,
      });

      facade.approveRecommendation(rec.id, "usr_alice");
      facade.executeRecommendation(rec.id);

      const rolledBack = facade.recommendationService.rollbackRecommendation(rec.id);
      expect(rolledBack?.approvalState).toBe("RolledBack");
    });
  });

  describe("5. Workspace Evolution Engine Capability", () => {
    it("analyzes Workspace DNA and generates explainable, reversible proposals", () => {
      const proposals = facade.analyzeAndEvolveWorkspace("ws_alpha", {
        workingPatterns: [{ name: "Focus Hours", frequency: 10, lastObserved: Date.now() }],
        layoutUsage: [{ name: "Double Split View", frequency: 6, lastObserved: Date.now() }],
        meetingStructures: [{ name: "Weekly Sync", frequency: 3, lastObserved: Date.now() }],
        recurringWorkflows: [{ name: "Post-Meeting Action Extraction", frequency: 4, lastObserved: Date.now() }],
        metadataConventions: [],
        graphEvolutionRate: 15,
        teamCollaborationPatterns: [],
      });

      expect(proposals.length).toBeGreaterThanOrEqual(3);

      const autoProp = proposals.find((p) => p.category === "AutomationRule");
      expect(autoProp).toBeDefined();
      expect(autoProp?.title).toContain("Post-Meeting Action Extraction");
      expect(autoProp?.isReversible).toBe(true);
    });
  });

  describe("Cross-Cutting Integration via Platform Event Bus", () => {
    it("reactively converts domain events into timeline entries, health updates, and recommendations", async () => {
      await eventBus.publish("meeting.analyzed", {
        meetingId: "mtg_404",
        title: "Architecture Review",
        actionItems: [
          { id: "ai_1", description: "Draft RFC", assignee: null },
          { id: "ai_2", description: "Setup CI pipeline", assignee: null },
        ],
      }, { workspaceId: "ws_alpha", tenantId: "tenant_1" });

      const events = facade.getTimelineEvents({ workspaceId: "ws_alpha" });
      expect(events.length).toBe(1);
      expect(events[0]?.summary).toContain("Architecture Review");

      const recs = facade.getRecommendations("ws_alpha", "MissingOwner");
      expect(recs.length).toBe(1);
      expect(recs[0]?.title).toContain("Assign Owners to 2 Action Items");
    });
  });
});
