import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import { ICrossAgentValidationEngine } from "../contracts/collaboration-contract";
import { ValidationReport } from "../domain/models";

export class CrossAgentValidationEngine implements ICrossAgentValidationEngine {
  public async validate(
    sourceId: string,
    evidencePackages: AgentEvidencePackage<any>[]
  ): Promise<ValidationReport> {
    const reportId = `val_rep_${sourceId}_${Date.now()}`;
    const evaluatedPackageIds = evidencePackages.map((p) => p.packageId);

    if (evidencePackages.length === 0) {
      return {
        reportId,
        sourceId,
        evaluatedPackageIds: [],
        agreementScore: 0,
        contradictionScore: 0,
        completenessScore: 0,
        ambiguityScore: 1,
        missingEvidenceCapabilities: ["all"],
        unresolvedConflicts: [],
        confidenceAdjustments: {},
        recommendedAction: "HumanReviewRequired",
        humanReviewReasons: ["No evidence packages provided for validation."],
        evaluatedAt: Date.now(),
      };
    }

    // Index packages by agent / capability
    const pkgByAgent = new Map<string, AgentEvidencePackage<any>>();
    for (const pkg of evidencePackages) {
      pkgByAgent.set(pkg.agentId, pkg);
    }

    const decPkg = pkgByAgent.get("agent-decision-extraction");
    const actPkg = pkgByAgent.get("agent-action-extraction");
    const riskPkg = pkgByAgent.get("agent-risk");
    const knowPkg = pkgByAgent.get("agent-knowledge");

    const unresolvedConflicts: ValidationReport["unresolvedConflicts"] = [];
    let totalComparisons = 0;
    let agreementCount = 0;
    let contradictionCount = 0;

    // Rule 1: Decision vs Risk Check (e.g. Approved budget vs Risk of no budget)
    if (decPkg && riskPkg) {
      totalComparisons++;
      const decisions: any[] = decPkg.payload?.decisions || [];
      const risks: any[] = riskPkg.payload?.risks || [];

      const approvedBudgetDecision = decisions.find((d) =>
        /budget|approval|financial/i.test(d.title || d.description || "")
      );
      const noApprovalRisk = risks.find((r) =>
        /no approval|unapproved|budget missing|lack of funds/i.test(r.title || r.description || "")
      );

      if (approvedBudgetDecision && noApprovalRisk) {
        contradictionCount++;
        unresolvedConflicts.push({
          capabilityA: "agent-decision-extraction",
          capabilityB: "agent-risk",
          topic: "Budget Approval",
          description: `Decision agent claims '${approvedBudgetDecision.title}' whereas Risk agent flags '${noApprovalRisk.description || noApprovalRisk.title}'.`,
        });
      } else {
        agreementCount++;
      }
    }

    // Rule 2: Decision vs Knowledge Check
    if (decPkg && knowPkg) {
      totalComparisons++;
      const decisions: any[] = decPkg.payload?.decisions || [];
      const knowItems: any[] = knowPkg.payload?.knowledgeItems || [];

      const unbackedDecision = decisions.find((d) => {
        const matchesTopic = knowItems.some((k) => k.topic === d.topic || k.title?.includes(d.topic));
        return !matchesTopic && d.confidence < 0.8;
      });

      if (unbackedDecision) {
        contradictionCount++;
        unresolvedConflicts.push({
          capabilityA: "agent-decision-extraction",
          capabilityB: "agent-knowledge",
          topic: unbackedDecision.topic || "Decision Grounding",
          description: `Decision '${unbackedDecision.title}' has weak confidence (${unbackedDecision.confidence}) and no matching historical knowledge mapping.`,
        });
      } else {
        agreementCount++;
      }
    }

    // Rule 3: Action Owner vs Diarized Speakers Check
    if (actPkg) {
      totalComparisons++;
      const actions: any[] = actPkg.payload?.actions || [];
      const unassignedAction = actions.find((a) => !a.owner || a.owner === "Unassigned");

      if (unassignedAction) {
        contradictionCount++;
        unresolvedConflicts.push({
          capabilityA: "agent-action-extraction",
          capabilityB: "agent-diarization",
          topic: "Action Ownership",
          description: `Action item '${unassignedAction.title}' lacks an assigned owner.`,
        });
      } else {
        agreementCount++;
      }
    }

    // Compute metrics
    const agreementScore = totalComparisons > 0 ? agreementCount / totalComparisons : 1.0;
    const contradictionScore = totalComparisons > 0 ? contradictionCount / totalComparisons : 0.0;

    // Check missing capabilities
    const expectedCapabilities = [
      "agent-transcription",
      "agent-diarization",
      "agent-topic-segmentation",
      "agent-decision-extraction",
      "agent-action-extraction",
      "agent-risk",
    ];
    const missingEvidenceCapabilities = expectedCapabilities.filter((c) => !pkgByAgent.has(c));

    const completenessScore = 1 - missingEvidenceCapabilities.length / expectedCapabilities.length;

    // Ambiguity score derived from agent quality scores
    const avgAmbiguity =
      evidencePackages.reduce((acc, p) => acc + (p.quality?.ambiguityScore || 0.2), 0) / evidencePackages.length;
    const ambiguityScore = Math.min(1, Math.max(0, avgAmbiguity + contradictionScore * 0.3));

    // Confidence adjustments per capability
    const confidenceAdjustments: Record<string, number> = {};
    for (const pkg of evidencePackages) {
      let adj = 0;
      if (contradictionScore > 0.4) adj -= 0.15;
      if (completenessScore < 0.8) adj -= 0.1;
      if (pkg.quality && pkg.quality.consistencyScore > 0.8) adj += 0.05;
      confidenceAdjustments[pkg.agentId] = Number(adj.toFixed(2));
    }

    // Recommended action
    let recommendedAction: ValidationReport["recommendedAction"] = "ConsensusPossible";
    const humanReviewReasons: string[] = [];
    const rePassCapabilities: string[] = [];

    if (contradictionScore >= 0.5) {
      recommendedAction = "HumanReviewRequired";
      humanReviewReasons.push(
        `High contradiction score (${(contradictionScore * 100).toFixed(0)}%) detected across agent conclusions.`
      );
    } else if (missingEvidenceCapabilities.length > 0) {
      recommendedAction = "TargetedRePass";
      rePassCapabilities.push(...missingEvidenceCapabilities);
    } else if (ambiguityScore > 0.6) {
      recommendedAction = "TargetedRePass";
      rePassCapabilities.push("agent-topic-segmentation", "agent-decision-extraction");
    }

    return {
      reportId,
      sourceId,
      evaluatedPackageIds,
      agreementScore: Number(agreementScore.toFixed(2)),
      contradictionScore: Number(contradictionScore.toFixed(2)),
      completenessScore: Number(completenessScore.toFixed(2)),
      ambiguityScore: Number(ambiguityScore.toFixed(2)),
      missingEvidenceCapabilities,
      unresolvedConflicts,
      confidenceAdjustments,
      recommendedAction,
      rePassRequestedCapabilities: rePassCapabilities.length > 0 ? rePassCapabilities : undefined,
      humanReviewReasons: humanReviewReasons.length > 0 ? humanReviewReasons : undefined,
      evaluatedAt: Date.now(),
    };
  }
}
