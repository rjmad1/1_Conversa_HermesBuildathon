import { IDebateCoordinator, IDebateCoordinatorPolicy } from "../contracts/collaboration-contract";
import { ValidationReport } from "../domain/models";

export class DebateCoordinator implements IDebateCoordinator {
  private defaultPolicy: IDebateCoordinatorPolicy = {
    minConfidence: 0.65,
    maxContradictionRatio: 0.35,
    minAgreementRatio: 0.6,
    maxAmbiguityScore: 0.55,
    maxRePassAttempts: 2,
  };

  public async evaluateDebate(
    validationReport: ValidationReport,
    customPolicy?: Partial<IDebateCoordinatorPolicy>
  ): Promise<{
    decision: "ConsensusPossible" | "TargetedRePass" | "HumanReviewRequired";
    rePassCapabilities?: string[];
    reasons?: string[];
  }> {
    const policy = { ...this.defaultPolicy, ...customPolicy };
    const reasons: string[] = [];

    // 1. Mandatory Human Review checks
    if (validationReport.recommendedAction === "HumanReviewRequired") {
      reasons.push(...(validationReport.humanReviewReasons || ["Validation engine requested human review."]));
      return { decision: "HumanReviewRequired", reasons };
    }

    if (validationReport.contradictionScore > policy.maxContradictionRatio) {
      reasons.push(
        `Contradiction ratio (${validationReport.contradictionScore}) exceeds policy threshold (${policy.maxContradictionRatio}).`
      );
      return { decision: "HumanReviewRequired", reasons };
    }

    // Check critical unresolved conflicts
    const criticalConflict = validationReport.unresolvedConflicts.find(
      (c) => /budget|approval|legal|security/i.test(c.topic)
    );
    if (criticalConflict) {
      reasons.push(`Unresolved critical domain conflict: [${criticalConflict.topic}] ${criticalConflict.description}`);
      return { decision: "HumanReviewRequired", reasons };
    }

    // 2. Targeted Re-pass checks
    if (validationReport.missingEvidenceCapabilities.length > 0) {
      reasons.push(
        `Missing evidence from capabilities: ${validationReport.missingEvidenceCapabilities.join(", ")}`
      );
      return {
        decision: "TargetedRePass",
        rePassCapabilities: validationReport.missingEvidenceCapabilities,
        reasons,
      };
    }

    if (validationReport.ambiguityScore > policy.maxAmbiguityScore) {
      const targetCaps = validationReport.rePassRequestedCapabilities || [
        "agent-topic-segmentation",
        "agent-decision-extraction",
      ];
      reasons.push(
        `Ambiguity score (${validationReport.ambiguityScore}) exceeds threshold (${policy.maxAmbiguityScore}). Requesting targeted re-pass.`
      );
      return {
        decision: "TargetedRePass",
        rePassCapabilities: targetCaps,
        reasons,
      };
    }

    // 3. Consensus Possible
    if (validationReport.agreementScore >= policy.minAgreementRatio) {
      return {
        decision: "ConsensusPossible",
        reasons: ["Agreement ratio satisfied policy threshold. Evidence packages ready for consensus generation."],
      };
    }

    // Fallback
    reasons.push(`Agreement score (${validationReport.agreementScore}) below required minimum (${policy.minAgreementRatio}).`);
    return { decision: "HumanReviewRequired", reasons };
  }
}
