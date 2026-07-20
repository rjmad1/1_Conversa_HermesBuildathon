/**
 * Engine 9: Workspace DNA Engine
 * Pattern learning & explainable recommendation generation (surfacing relevant info, layout proposals, automation suggestions).
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { WorkspaceDNA, DNARecommendation } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { IWorkspaceDNAStore } from "../../domain/ports/provider-ports";

export class WorkspaceDNAEngine {
  private currentDNA: WorkspaceDNA | null = null;

  constructor(
    private dnaStore: IWorkspaceDNAStore,
    private eventBus: PlatformEventBus
  ) {}

  public async getOrInitializeDNA(workspaceId: string): Promise<WorkspaceDNA> {
    const loaded = await this.dnaStore.getDNA(workspaceId);
    if (loaded) {
      this.currentDNA = loaded;
    } else {
      this.currentDNA = {
        workspaceId,
        activeInitiatives: [
          { name: "NextGen Interaction Intelligence", frequency: 12, lastActive: Date.now() },
        ],
        workingStyle: {
          primaryCategory: "Deep Knowledge & Graph Navigation",
          activeHoursPeak: "14:00 - 18:00",
          preferredView: "Graph + Split Inspector",
        },
        commonEntityIds: ["ent_meeting_q3", "ent_spec_ui"],
        frequentlyLinkedKnowledge: ["doc_arch_spec", "decision_react_server_components"],
        preferredLayoutId: "layout_product_kanban",
        automationHabits: ["auto_summarize_meetings", "auto_extract_action_items"],
        meetingPatterns: ["Weekly Sync Tuesdays 10am", "Architecture Review Thursdays 2pm"],
        graphEvolutionMetrics: { nodeCount: 1420, edgeCount: 3890, growthRate: 0.15 },
        workspacePriorities: ["Deploy Interaction Intelligence Layer", "Prepare AegisOS Adapter"],
        recommendations: [],
        updatedAt: Date.now(),
      };
      await this.dnaStore.saveDNA(this.currentDNA);
    }
    return this.currentDNA;
  }

  public async generateRecommendation(
    category: DNARecommendation["category"],
    title: string,
    explanation: string,
    confidenceScore: number,
    payload: Record<string, unknown>
  ): Promise<DNARecommendation> {
    const recommendation: DNARecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      title,
      explanation,
      confidenceScore,
      payload,
      status: "proposed",
      createdAt: Date.now(),
    };

    if (this.currentDNA) {
      this.currentDNA.recommendations.unshift(recommendation);
      this.currentDNA.updatedAt = Date.now();
      await this.dnaStore.saveDNA(this.currentDNA);
    }

    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.DNA_RECOMMENDATION_GENERATED, {
      recommendation,
    });

    return recommendation;
  }

  public async resolveRecommendation(
    id: string,
    action: "accepted" | "dismissed" | "snoozed"
  ): Promise<void> {
    if (!this.currentDNA) return;

    const rec = this.currentDNA.recommendations.find((r) => r.id === id);
    if (rec) {
      rec.status = action;
      this.currentDNA.updatedAt = Date.now();
      await this.dnaStore.saveDNA(this.currentDNA);

      await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.DNA_RECOMMENDATION_RESOLVED, {
        recommendationId: id,
        action,
      });
    }
  }
}
