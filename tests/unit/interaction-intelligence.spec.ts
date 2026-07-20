import { describe, it, expect, beforeEach } from "vitest";
import { InteractionIntelligenceFacade } from "../../src/modules/interaction-intelligence";
import { AegisOSProviderAdapter } from "../../src/modules/interaction-intelligence/infrastructure/adapters/aegis-os-adapter";

describe("Interaction Intelligence Layer - Unit Tests", () => {
  let facade: InteractionIntelligenceFacade;

  beforeEach(async () => {
    facade = new InteractionIntelligenceFacade();
    await facade.initialize("tenant_test", "workspace_test", "user_test");
  });

  it("1. Workspace Session Memory Engine initialization & state persistence", async () => {
    const memory = facade.sessionMemory.getCurrentMemory();
    expect(memory).not.toBeNull();
    expect(memory?.workspaceId).toBe("workspace_test");
    expect(memory?.openPanes).toEqual([]);

    facade.sessionMemory.updateCameraPosition({ x: 100, y: 200, zoom: 1.5 });
    expect(facade.sessionMemory.getCurrentMemory()?.graphCameraPosition).toEqual({
      x: 100,
      y: 200,
      zoom: 1.5,
    });
  });

  it("2. Spatial Navigation History Engine snapshot capture & lossless traversal", async () => {
    const snap1 = await facade.spatialHistory.captureSnapshot({
      workspaceId: "workspace_test",
      activeNode: {
        id: "node_1",
        type: "Meeting",
        title: "Q3 Roadmap Sync",
        uri: "workspace://meetings/q3",
        timestamp: Date.now(),
      },
      paneState: [],
      contextStackId: "ctx_1",
      graphViewport: { x: 0, y: 0, zoom: 1 },
      inspectorState: { isOpen: false, activeTab: "details", width: 320 },
      filters: { tags: [], customFilters: {} },
      searchState: { query: "" },
    });

    expect(snap1.activeNode.title).toBe("Q3 Roadmap Sync");
    expect(facade.spatialHistory.canGoBack()).toBe(false);

    await facade.spatialHistory.captureSnapshot({
      workspaceId: "workspace_test",
      activeNode: {
        id: "node_2",
        type: "Decision",
        title: "Approve Tech Stack",
        uri: "workspace://decisions/tech-stack",
        timestamp: Date.now(),
      },
      paneState: [],
      contextStackId: "ctx_2",
      graphViewport: { x: 50, y: 50, zoom: 1.2 },
      inspectorState: { isOpen: true, activeTab: "trace", width: 320 },
      filters: { tags: ["arch"], customFilters: {} },
      searchState: { query: "AegisOS" },
    });

    expect(facade.spatialHistory.canGoBack()).toBe(true);

    const backSnap = await facade.spatialHistory.navigateBack();
    expect(backSnap?.activeNode.title).toBe("Q3 Roadmap Sync");

    const forwardSnap = await facade.spatialHistory.navigateForward();
    expect(forwardSnap?.activeNode.title).toBe("Approve Tech Stack");
  });

  it("3. Context Stack Engine layer pushing & popping", async () => {
    const frame1 = await facade.contextStack.pushFrame("Meeting", "m_1", "Sprint Review");
    expect(frame1.status).toBe("active");
    expect(facade.contextStack.getStack().depth).toBe(1);

    const frame2 = await facade.contextStack.pushFrame("Decision", "d_1", "Deploy Intelligence Layer");
    expect(facade.contextStack.getStack().depth).toBe(2);
    expect(facade.contextStack.peekFrame()?.title).toBe("Deploy Intelligence Layer");

    const popped = await facade.contextStack.popFrame();
    expect(popped?.title).toBe("Deploy Intelligence Layer");
    expect(facade.contextStack.getStack().depth).toBe(1);
  });

  it("4. Entity Preview Engine hover/peek resolution & pinning", async () => {
    const preview = await facade.entityPreview.getPreview("ent_999", "Hover");
    expect(preview.entityId).toBe("ent_999");
    expect(preview.status).toBe("Active");
    expect(preview.confidenceScore).toBe(92);

    facade.entityPreview.pinPreview(preview);
    expect(facade.entityPreview.getPinnedPreviews().length).toBe(1);

    facade.entityPreview.unpinPreview("ent_999");
    expect(facade.entityPreview.getPinnedPreviews().length).toBe(0);
  });

  it("5. Universal Activity Layer logging & pending approvals", async () => {
    await facade.universalActivity.logActivity(
      "Pending_Approval",
      "High",
      "AegisOS Migration Request",
      "Approval required to enable AegisOS Kernel Sync",
      "System"
    );

    const pending = facade.universalActivity.getPendingApprovals();
    expect(pending.length).toBe(1);
    expect(pending[0]?.title).toBe("AegisOS Migration Request");
  });

  it("6. AI Confidence Engine evaluation & governance compliance", () => {
    const explanation = facade.aiConfidence.evaluateArtifact(
      "art_10",
      96,
      [
        {
          sourceId: "src_1",
          sourceType: "CodeGraph",
          reasoningSummary: "Analyzed module ports",
          verificationStatus: "verified",
          approvalState: "approved",
          timestamp: Date.now(),
        },
      ],
      "High confidence code analysis"
    );

    expect(explanation.confidenceBand).toBe("High");
    expect(explanation.isGovernanceCompliant).toBe(true);
  });

  it("7. Progressive Complexity Engine capability gating", async () => {
    expect(facade.progressiveComplexity.getLevel()).toBe("Professional");
    expect(facade.progressiveComplexity.isFeatureEnabled("spatial_history")).toBe(true);

    await facade.progressiveComplexity.setLevel("user_test", "Enterprise");
    expect(facade.progressiveComplexity.isFeatureEnabled("aegis_kernel_sync")).toBe(true);
  });

  it("8. Persona Engine profile switching", async () => {
    expect(facade.persona.getActivePersona()).toBe("Product");

    const execConfig = await facade.persona.setPersona("Executive");
    expect(execConfig.personaType).toBe("Executive");
    expect(facade.persona.getActivePersona()).toBe("Executive");
  });

  it("9. Workspace DNA Engine recommendation generation & resolution", async () => {
    const dna = await facade.workspaceDNA.getOrInitializeDNA("workspace_test");
    expect(dna.workspaceId).toBe("workspace_test");

    const rec = await facade.workspaceDNA.generateRecommendation(
      "Layout",
      "Switch to Research Canvas",
      "User spends 70% time in knowledge graph",
      91,
      { layoutId: "layout_research_canvas" }
    );

    expect(rec.title).toBe("Switch to Research Canvas");

    await facade.workspaceDNA.resolveRecommendation(rec.id, "accepted");
    expect(dna.recommendations.find((r) => r.id === rec.id)?.status).toBe("accepted");
  });

  it("10. Explainability Engine trace recording & AegisOS Adapter registration", () => {
    const trace = facade.explainability.recordTrace(
      "target_card_1",
      "WhyRecommended",
      "Recommended based on active initiative Q3 Roadmap",
      ["Activity: 14 graph edits in workspace"],
      "WorkspaceDNAEngine",
      "Reorganized navigation menu",
      92
    );

    expect(trace.reason.explanation).toContain("Q3 Roadmap");
    expect(facade.explainability.getTraceForTarget("target_card_1")).toEqual(trace);

    // AegisOS Provider Adapter testing
    const aegisAdapter = new AegisOSProviderAdapter();
    facade.registerAegisOSAdapter(aegisAdapter);
    expect(facade.isAegisOSActive()).toBe(true);
  });
});
