/**
 * Workspace Health Engine Application Service
 */

import { PlatformEventBus } from "../../../../platform/events";
import { LIVING_WORKSPACE_EVENTS } from "../../domain/events";
import type {
  WorkspaceHealthScore,
  DomainHealthScore,
  HealthDomain,
  HealthStatus,
} from "../../domain/types";
import { LivingKnowledgeGraphService } from "./living-knowledge-graph-service";

export interface WorkspaceHealthInputs {
  overdueTasksCount?: number;
  blockedWorkflowsCount?: number;
  pendingApprovalsCount?: number;
  failedAutomationsCount?: number;
  aiConfidenceAverage?: number; // 0.0 - 1.0
  explainabilityCoverageRatio?: number; // 0.0 - 1.0
  unresolvedRecommendationsCount?: number;
  policyViolationsCount?: number;
  missingApprovalsCount?: number;
  auditCompletenessRatio?: number; // 0.0 - 1.0
  unownedEntitiesCount?: number;
  syncLatencyMs?: number;
}

export class WorkspaceHealthService {
  private healthCache: Map<string, WorkspaceHealthScore> = new Map();

  constructor(
    private eventBus: PlatformEventBus,
    private graphService?: LivingKnowledgeGraphService
  ) {}

  public calculateHealth(workspaceId: string, inputs: WorkspaceHealthInputs = {}): WorkspaceHealthScore {
    const previousScore = this.healthCache.get(workspaceId)?.overallScore;

    // 1. Knowledge Quality Domain
    const graphMetrics = this.graphService?.getGraphHealthMetrics() || {
      orphanCount: 0,
      duplicateCount: 0,
      staleCount: 0,
      brokenCount: 0,
      graphHealthScore: 100,
    };
    const unownedPenalties = (inputs.unownedEntitiesCount || 0) * 4;
    const kqScore = Math.max(0, Math.min(100, graphMetrics.graphHealthScore - unownedPenalties));
    const kqDomain: DomainHealthScore = {
      domain: "KnowledgeQuality",
      score: kqScore,
      status: this.scoreToStatus(kqScore),
      metrics: {
        orphanEntities: graphMetrics.orphanCount,
        duplicateEntities: graphMetrics.duplicateCount,
        staleEntities: graphMetrics.staleCount,
        brokenRelationships: graphMetrics.brokenCount,
        unownedEntities: inputs.unownedEntitiesCount || 0,
      },
      keyIssues: [
        ...(graphMetrics.orphanCount > 0 ? [`${graphMetrics.orphanCount} orphan entities detected`] : []),
        ...(graphMetrics.duplicateCount > 0 ? [`${graphMetrics.duplicateCount} duplicate entity candidates found`] : []),
        ...(graphMetrics.staleCount > 0 ? [`${graphMetrics.staleCount} stale knowledge items found`] : []),
      ],
    };

    // 2. Execution Health Domain
    let execScore = 100;
    execScore -= (inputs.overdueTasksCount || 0) * 5;
    execScore -= (inputs.blockedWorkflowsCount || 0) * 10;
    execScore -= (inputs.pendingApprovalsCount || 0) * 3;
    execScore -= (inputs.failedAutomationsCount || 0) * 8;
    execScore = Math.max(0, Math.min(100, execScore));
    const execDomain: DomainHealthScore = {
      domain: "ExecutionHealth",
      score: execScore,
      status: this.scoreToStatus(execScore),
      metrics: {
        overdueTasks: inputs.overdueTasksCount || 0,
        blockedWorkflows: inputs.blockedWorkflowsCount || 0,
        pendingApprovals: inputs.pendingApprovalsCount || 0,
        failedAutomations: inputs.failedAutomationsCount || 0,
      },
      keyIssues: [
        ...(inputs.overdueTasksCount ? [`${inputs.overdueTasksCount} overdue tasks`] : []),
        ...(inputs.blockedWorkflowsCount ? [`${inputs.blockedWorkflowsCount} blocked workflows`] : []),
        ...(inputs.failedAutomationsCount ? [`${inputs.failedAutomationsCount} failed automations`] : []),
      ],
    };

    // 3. AI Health Domain
    const aiConf = inputs.aiConfidenceAverage !== undefined ? inputs.aiConfidenceAverage * 100 : 90;
    const expCov = inputs.explainabilityCoverageRatio !== undefined ? inputs.explainabilityCoverageRatio * 100 : 95;
    const recPenalties = (inputs.unresolvedRecommendationsCount || 0) * 2;
    const aiScore = Math.max(0, Math.min(100, Math.round((aiConf * 0.5 + expCov * 0.5) - recPenalties)));
    const aiDomain: DomainHealthScore = {
      domain: "AIHealth",
      score: aiScore,
      status: this.scoreToStatus(aiScore),
      metrics: {
        confidenceAverage: Math.round(aiConf),
        explainabilityCoverage: Math.round(expCov),
        unresolvedRecommendations: inputs.unresolvedRecommendationsCount || 0,
      },
      keyIssues: [
        ...(inputs.unresolvedRecommendationsCount ? [`${inputs.unresolvedRecommendationsCount} unresolved recommendations`] : []),
        ...(expCov < 80 ? ["Low explainability coverage ratio"] : []),
      ],
    };

    // 4. Governance Health Domain
    const auditCov = inputs.auditCompletenessRatio !== undefined ? inputs.auditCompletenessRatio * 100 : 100;
    let govScore = auditCov;
    govScore -= (inputs.policyViolationsCount || 0) * 15;
    govScore -= (inputs.missingApprovalsCount || 0) * 5;
    govScore = Math.max(0, Math.min(100, Math.round(govScore)));
    const govDomain: DomainHealthScore = {
      domain: "Governance",
      score: govScore,
      status: this.scoreToStatus(govScore),
      metrics: {
        policyViolations: inputs.policyViolationsCount || 0,
        missingApprovals: inputs.missingApprovalsCount || 0,
        auditCompleteness: Math.round(auditCov),
      },
      keyIssues: [
        ...(inputs.policyViolationsCount ? [`${inputs.policyViolationsCount} policy violations`] : []),
        ...(inputs.missingApprovalsCount ? [`${inputs.missingApprovalsCount} missing approvals`] : []),
      ],
    };

    // 5. Collaboration Health Domain
    const collabScore = 88;
    const collabDomain: DomainHealthScore = {
      domain: "Collaboration",
      score: collabScore,
      status: this.scoreToStatus(collabScore),
      metrics: { ownershipCoverage: 92, activeParticipation: 85 },
      keyIssues: [],
    };

    // 6. Performance Health Domain
    const perfScore = inputs.syncLatencyMs && inputs.syncLatencyMs > 1000 ? 70 : 95;
    const perfDomain: DomainHealthScore = {
      domain: "Performance",
      score: perfScore,
      status: this.scoreToStatus(perfScore),
      metrics: { syncLatencyMs: inputs.syncLatencyMs || 120 },
      keyIssues: [
        ...(inputs.syncLatencyMs && inputs.syncLatencyMs > 1000 ? [`High sync latency: ${inputs.syncLatencyMs}ms`] : []),
      ],
    };

    // Weighted Overall Score:
    // Knowledge Quality: 25%, Execution: 25%, AI: 20%, Governance: 15%, Collaboration: 10%, Performance: 5%
    const overallScore = Math.round(
      kqScore * 0.25 +
      execScore * 0.25 +
      aiScore * 0.20 +
      govScore * 0.15 +
      collabScore * 0.10 +
      perfScore * 0.05
    );

    let trend: "improving" | "stable" | "declining" = "stable";
    if (previousScore !== undefined) {
      if (overallScore > previousScore + 2) trend = "improving";
      else if (overallScore < previousScore - 2) trend = "declining";
    }

    const healthScore: WorkspaceHealthScore = {
      workspaceId,
      overallScore,
      status: this.scoreToStatus(overallScore),
      domains: {
        KnowledgeQuality: kqDomain,
        ExecutionHealth: execDomain,
        AIHealth: aiDomain,
        Governance: govDomain,
        Collaboration: collabDomain,
        Performance: perfDomain,
      },
      updatedAt: Date.now(),
      trend,
    };

    this.healthCache.set(workspaceId, healthScore);

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.HEALTH_SCORE_UPDATED, {
      workspaceId,
      overallScore,
      status: healthScore.status,
      previousScore,
      timestamp: Date.now(),
    });

    return healthScore;
  }

  public getHealthScore(workspaceId: string): WorkspaceHealthScore | undefined {
    return this.healthCache.get(workspaceId);
  }

  private scoreToStatus(score: number): HealthStatus {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Healthy";
    if (score >= 60) return "AttentionNeeded";
    if (score >= 40) return "AtRisk";
    return "Critical";
  }
}
