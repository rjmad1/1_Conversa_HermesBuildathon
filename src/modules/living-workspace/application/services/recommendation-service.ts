/**
 * Recommendation Engine Application Service
 */

import { PlatformEventBus } from "../../../../platform/events";
import { LIVING_WORKSPACE_EVENTS } from "../../domain/events";
import type {
  Recommendation,
  RecommendationCategory,
} from "../../domain/types";

export class RecommendationService {
  private recommendations: Map<string, Recommendation> = new Map();

  constructor(private eventBus: PlatformEventBus) {}

  public generateRecommendation(input: {
    workspaceId: string;
    category: RecommendationCategory;
    title: string;
    description: string;
    rationale: string;
    evidence: string[];
    impact: "High" | "Medium" | "Low";
    confidenceScore: number;
    canUndo?: boolean;
    targetEntityId?: string;
    payload?: Record<string, unknown>;
    policyRequiredApproval?: boolean;
  }): Recommendation {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const canUndo = input.canUndo !== undefined ? input.canUndo : true;
    const policyRequiredApproval = input.policyRequiredApproval !== undefined ? input.policyRequiredApproval : true;

    const recommendation: Recommendation = {
      id,
      workspaceId: input.workspaceId,
      category: input.category,
      title: input.title,
      description: input.description,
      rationale: input.rationale,
      evidence: input.evidence,
      impact: input.impact,
      confidenceScore: Math.min(1.0, Math.max(0.0, input.confidenceScore)),
      canUndo,
      approvalState: "Generated",
      targetEntityId: input.targetEntityId,
      payload: input.payload || {},
      policyRequiredApproval,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.recommendations.set(id, recommendation);

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.RECOMMENDATION_GENERATED, {
      recommendationId: id,
      workspaceId: input.workspaceId,
      category: input.category,
      title: input.title,
      confidenceScore: recommendation.confidenceScore,
      impact: input.impact,
    });

    // Automatically transition through policy evaluation
    this.evaluatePolicy(id);

    return this.recommendations.get(id)!;
  }

  public evaluatePolicy(recommendationId: string): Recommendation | null {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return null;

    rec.approvalState = "PolicyEvaluated";
    rec.updatedAt = Date.now();

    if (rec.policyRequiredApproval) {
      rec.approvalState = "AwaitingApproval";
    }

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.RECOMMENDATION_POLICY_EVALUATED, {
      recommendationId: rec.id,
      workspaceId: rec.workspaceId,
      approvalState: rec.approvalState,
    });

    return rec;
  }

  public approveRecommendation(recommendationId: string, approverId: string): Recommendation | null {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return null;

    if (rec.approvalState !== "AwaitingApproval" && rec.approvalState !== "PolicyEvaluated") {
      throw new Error(`Cannot approve recommendation in state ${rec.approvalState}`);
    }

    rec.approvalState = "Approved";
    rec.updatedAt = Date.now();

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.RECOMMENDATION_APPROVED, {
      recommendationId: rec.id,
      workspaceId: rec.workspaceId,
      approverId,
      approvedAt: rec.updatedAt,
    });

    return rec;
  }

  public executeRecommendation(recommendationId: string): Recommendation | null {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return null;

    if (rec.approvalState !== "Approved") {
      throw new Error(`Recommendation ${recommendationId} must be Approved before execution (Current: ${rec.approvalState})`);
    }

    rec.approvalState = "Executing";
    rec.updatedAt = Date.now();

    // Mark completed
    rec.approvalState = "Completed";
    rec.updatedAt = Date.now();

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.RECOMMENDATION_EXECUTED, {
      recommendationId: rec.id,
      workspaceId: rec.workspaceId,
      executedAt: rec.updatedAt,
      resultingEventIds: [],
    });

    return rec;
  }

  public rejectRecommendation(recommendationId: string, reason?: string): Recommendation | null {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return null;

    rec.approvalState = "Rejected";
    rec.updatedAt = Date.now();
    if (reason) {
      rec.payload.rejectionReason = reason;
    }
    return rec;
  }

  public rollbackRecommendation(recommendationId: string): Recommendation | null {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return null;

    if (!rec.canUndo) {
      throw new Error(`Recommendation ${recommendationId} cannot be rolled back.`);
    }

    if (rec.approvalState !== "Completed") {
      throw new Error(`Only completed recommendations can be rolled back (Current: ${rec.approvalState})`);
    }

    rec.approvalState = "RolledBack";
    rec.updatedAt = Date.now();

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.RECOMMENDATION_ROLLED_BACK, {
      recommendationId: rec.id,
      workspaceId: rec.workspaceId,
      rolledBackAt: rec.updatedAt,
    });

    return rec;
  }

  public getRecommendations(workspaceId: string, category?: RecommendationCategory): Recommendation[] {
    return Array.from(this.recommendations.values()).filter(
      (r) => r.workspaceId === workspaceId && (!category || r.category === category)
    );
  }

  public getRecommendationById(id: string): Recommendation | undefined {
    return this.recommendations.get(id);
  }
}
