/**
 * Living Workspace Facade - Unified Intelligence Orchestration
 */

import { PlatformEventBus, PlatformEvent } from "../../../../platform/events";
import { LivingKnowledgeGraphService } from "../services/living-knowledge-graph-service";
import { WorkspaceTimelineService } from "../services/workspace-timeline-service";
import { WorkspaceHealthService } from "../services/workspace-health-service";
import { RecommendationService } from "../services/recommendation-service";
import { WorkspaceEvolutionService } from "../services/workspace-evolution-service";
import type {
  WorkspaceHealthScore,
  TimelineEvent,
  TimelineFilter,
  Recommendation,
  RecommendationCategory,
  WorkspaceEvolutionProposal,
  GraphHealthMetrics,
  WorkspaceDNAMetrics,
} from "../../domain/types";

export class LivingWorkspaceFacade {
  public graphService: LivingKnowledgeGraphService;
  public timelineService: WorkspaceTimelineService;
  public healthService: WorkspaceHealthService;
  public recommendationService: RecommendationService;
  public evolutionService: WorkspaceEvolutionService;

  private unsubscribeListeners: (() => void)[] = [];

  constructor(public readonly eventBus: PlatformEventBus) {
    this.graphService = new LivingKnowledgeGraphService(this.eventBus);
    this.timelineService = new WorkspaceTimelineService(this.eventBus);
    this.healthService = new WorkspaceHealthService(this.eventBus, this.graphService);
    this.recommendationService = new RecommendationService(this.eventBus);
    this.evolutionService = new WorkspaceEvolutionService(this.eventBus);

    this.registerEventSubscriptions();
  }

  private registerEventSubscriptions(): void {
    // 1. Meeting analyzed event
    const unSubMeeting = this.eventBus.subscribe("meeting.analyzed", (event: PlatformEvent) => {
      const payload = event.payload as Record<string, any>;
      this.timelineService.recordEvent({
        workspaceId: event.workspaceId || "default",
        tenantId: event.tenantId || "default",
        eventType: "ai_analysis",
        category: "Meeting Analysis",
        actorId: "system_ai",
        actorType: "ai",
        summary: `AI analyzed meeting: ${payload?.title || payload?.meetingId || "Untitled Meeting"}`,
        entityId: payload?.meetingId,
        payload,
        correlationId: event.correlationId,
      });

      // Generate recommendation for unassigned action items
      if (payload?.actionItems && Array.isArray(payload.actionItems)) {
        const unassigned = payload.actionItems.filter((item: any) => !item.assignee);
        if (unassigned.length > 0) {
          this.recommendationService.generateRecommendation({
            workspaceId: event.workspaceId || "default",
            category: "MissingOwner",
            title: `Assign Owners to ${unassigned.length} Action Items`,
            description: `Meeting produced ${unassigned.length} unassigned action items. Assigning owners ensures execution accountability.`,
            rationale: "Unassigned tasks decrease execution health score.",
            evidence: unassigned.map((i: any) => i.description || "Action item"),
            impact: "High",
            confidenceScore: 0.95,
            targetEntityId: payload?.meetingId,
            payload: { unassignedItems: unassigned },
          });
        }
      }

      this.recalculateWorkspaceHealth(event.workspaceId || "default");
    });
    this.unsubscribeListeners.push(unSubMeeting);

    // 2. Action approved event
    const unSubApproval = this.eventBus.subscribe("action.approved", (event: PlatformEvent) => {
      const payload = event.payload as Record<string, any>;
      this.timelineService.recordEvent({
        workspaceId: event.workspaceId || "default",
        tenantId: event.tenantId || "default",
        eventType: "approval",
        category: "Governance Approval",
        actorId: payload?.approvedBy || "user",
        actorType: "user",
        summary: `Action approved: ${payload?.actionId || "Proposed Action"}`,
        entityId: payload?.actionId,
        payload,
        correlationId: event.correlationId,
      });
      this.recalculateWorkspaceHealth(event.workspaceId || "default");
    });
    this.unsubscribeListeners.push(unSubApproval);

    // 3. User navigation event
    const unSubNav = this.eventBus.subscribe("user.navigated", (event: PlatformEvent) => {
      const payload = event.payload as Record<string, any>;
      this.timelineService.recordEvent({
        workspaceId: event.workspaceId || "default",
        tenantId: event.tenantId || "default",
        eventType: "graph_change",
        category: "Navigation",
        actorId: "user",
        actorType: "user",
        summary: `Navigated to ${payload?.title || payload?.uri || "View"}`,
        payload,
        correlationId: event.correlationId,
      });
    });
    this.unsubscribeListeners.push(unSubNav);
  }

  // --- Living Knowledge Graph API ---
  public getGraphHealth(workspaceId: string = "default"): GraphHealthMetrics {
    return this.graphService.getGraphHealthMetrics();
  }

  public detectKnowledgeGaps(workspaceId: string = "default") {
    return {
      orphans: this.graphService.detectOrphanNodes(),
      duplicates: this.graphService.detectDuplicateEntities(),
      staleItems: this.graphService.detectStaleKnowledge(),
    };
  }

  // --- Workspace Timeline API ---
  public getTimelineEvents(filter: TimelineFilter): TimelineEvent[] {
    return this.timelineService.getEvents(filter);
  }

  public recordTimelineEvent(eventInput: Omit<TimelineEvent, "id" | "timestamp">): TimelineEvent {
    return this.timelineService.recordEvent(eventInput);
  }

  public getActivitySummary(workspaceId: string = "default", periodMs?: number) {
    return this.timelineService.generateActivitySummary(workspaceId, periodMs);
  }

  // --- Workspace Health API ---
  public getWorkspaceHealth(workspaceId: string = "default"): WorkspaceHealthScore {
    return (
      this.healthService.getHealthScore(workspaceId) ||
      this.recalculateWorkspaceHealth(workspaceId)
    );
  }

  public recalculateWorkspaceHealth(workspaceId: string = "default"): WorkspaceHealthScore {
    const activeRecs = this.recommendationService.getRecommendations(workspaceId);
    const pendingRecs = activeRecs.filter((r) => r.approvalState === "AwaitingApproval").length;

    return this.healthService.calculateHealth(workspaceId, {
      unresolvedRecommendationsCount: pendingRecs,
    });
  }

  // --- Recommendation Engine API ---
  public getRecommendations(workspaceId: string = "default", category?: RecommendationCategory): Recommendation[] {
    return this.recommendationService.getRecommendations(workspaceId, category);
  }

  public approveRecommendation(recommendationId: string, approverId: string): Recommendation | null {
    const res = this.recommendationService.approveRecommendation(recommendationId, approverId);
    if (res) {
      this.timelineService.recordEvent({
        workspaceId: res.workspaceId,
        tenantId: "default",
        eventType: "approval",
        category: "Recommendation Approved",
        actorId: approverId,
        actorType: "user",
        summary: `Approved recommendation: ${res.title}`,
        entityId: res.id,
        payload: { recommendationId },
      });
      this.recalculateWorkspaceHealth(res.workspaceId);
    }
    return res;
  }

  public executeRecommendation(recommendationId: string): Recommendation | null {
    const res = this.recommendationService.executeRecommendation(recommendationId);
    if (res) {
      this.timelineService.recordEvent({
        workspaceId: res.workspaceId,
        tenantId: "default",
        eventType: "automation",
        category: "Recommendation Executed",
        actorId: "system",
        actorType: "system",
        summary: `Executed recommendation: ${res.title}`,
        entityId: res.id,
        payload: { recommendationId },
      });
      this.recalculateWorkspaceHealth(res.workspaceId);
    }
    return res;
  }

  // --- Workspace Evolution Engine API ---
  public analyzeAndEvolveWorkspace(workspaceId: string = "default", dnaMetrics: WorkspaceDNAMetrics): WorkspaceEvolutionProposal[] {
    return this.evolutionService.analyzeDNAAndPropose(workspaceId, dnaMetrics);
  }

  public getEvolutionProposals(workspaceId: string = "default"): WorkspaceEvolutionProposal[] {
    return this.evolutionService.getProposals(workspaceId);
  }

  public dispose(): void {
    for (const unSub of this.unsubscribeListeners) {
      unSub();
    }
    this.unsubscribeListeners = [];
  }
}
