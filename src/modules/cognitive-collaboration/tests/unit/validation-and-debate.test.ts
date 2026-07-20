import { AgentEvidencePackage } from "../../../meeting-intelligence/contracts/agent-contract";
import { CrossAgentValidationEngine } from "../../services/cross-agent-validation-engine";
import { DebateCoordinator } from "../../services/debate-coordinator";

export async function runValidationAndDebateUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const makePkg = (agentId: string, payload: any): AgentEvidencePackage<any> => ({
    packageId: `pkg_${agentId}`,
    agentId,
    agentName: agentId,
    agentVersion: "1.0.0",
    meetingId: "m_1",
    status: "Success",
    payload,
    overallConfidence: 0.9,
    evidence: [],
    reasoning: { extractionStrategy: "test", provider: "mock", model: "mock", promptVersion: "1.0", executionDurationMs: 10 },
    governance: { validationStatus: "Validated", privacyClassification: "Internal", policyCompliance: true, reviewRequired: false },
    quality: { ambiguityScore: 0.1, completenessScore: 0.9, consistencyScore: 0.9 },
    confidenceDistribution: { sourceConfidence: 0.9, modelConfidence: 0.9, evidenceStrength: 0.9, crossAgentAgreement: 0.9, validationConfidence: 0.9, overall: 0.9 },
    createdAt: Date.now(),
  });

  // Test 1: CrossAgentValidationEngine detects budget conflict
  try {
    const valEngine = new CrossAgentValidationEngine();

    const decPkg = makePkg("agent-decision-extraction", {
      decisions: [{ title: "Budget Approved for Q3", topic: "Budget Approval", confidence: 0.9 }],
    });
    const riskPkg = makePkg("agent-risk", {
      risks: [{ description: "No approval found for Q3 budget allocation", title: "Budget missing", severity: "High" }],
    });
    const actPkg = makePkg("agent-action-extraction", {
      actions: [{ title: "Deploy infrastructure", owner: "Alice", priority: "High" }],
    });
    const transPkg = makePkg("agent-transcription", {});
    const diarPkg = makePkg("agent-diarization", {});
    const topicPkg = makePkg("agent-topic-segmentation", {});

    const report = await valEngine.validate("m_1", [decPkg, riskPkg, actPkg, transPkg, diarPkg, topicPkg]);

    if (report.contradictionScore < 0.2 || report.unresolvedConflicts.length === 0) {
      throw new Error(`Expected conflict detection between decision & risk agents. Contradiction score: ${report.contradictionScore}`);
    }

    results.push({ name: "CrossAgentValidationEngine: Conflict Detection", passed: true });
  } catch (err: any) {
    results.push({ name: "CrossAgentValidationEngine: Conflict Detection", passed: false, error: err.message });
  }

  // Test 2: DebateCoordinator decisions (Consensus vs Human Review vs Targeted Re-pass)
  try {
    const coordinator = new DebateCoordinator();

    // Case A: Clean report -> ConsensusPossible
    const cleanReport = {
      reportId: "rep_clean",
      sourceId: "m_1",
      evaluatedPackageIds: ["p1"],
      agreementScore: 0.95,
      contradictionScore: 0.05,
      completenessScore: 1.0,
      ambiguityScore: 0.1,
      missingEvidenceCapabilities: [],
      unresolvedConflicts: [],
      confidenceAdjustments: {},
      recommendedAction: "ConsensusPossible" as const,
      evaluatedAt: Date.now(),
    };

    const resClean = await coordinator.evaluateDebate(cleanReport);
    if (resClean.decision !== "ConsensusPossible") {
      throw new Error(`Expected ConsensusPossible, got ${resClean.decision}`);
    }

    // Case B: High Contradiction -> HumanReviewRequired
    const conflictReport = {
      ...cleanReport,
      contradictionScore: 0.8,
      recommendedAction: "HumanReviewRequired" as const,
      humanReviewReasons: ["Severe conflict"],
    };

    const resConflict = await coordinator.evaluateDebate(conflictReport);
    if (resConflict.decision !== "HumanReviewRequired") {
      throw new Error(`Expected HumanReviewRequired, got ${resConflict.decision}`);
    }

    // Case C: Missing Evidence -> TargetedRePass
    const missingReport = {
      ...cleanReport,
      missingEvidenceCapabilities: ["agent-risk"],
      recommendedAction: "TargetedRePass" as const,
    };

    const resMissing = await coordinator.evaluateDebate(missingReport);
    if (resMissing.decision !== "TargetedRePass" || !resMissing.rePassCapabilities?.includes("agent-risk")) {
      throw new Error(`Expected TargetedRePass for agent-risk, got ${resMissing.decision}`);
    }

    results.push({ name: "DebateCoordinator: Policy Evaluation & Decision Matrix", passed: true });
  } catch (err: any) {
    results.push({ name: "DebateCoordinator: Policy Evaluation & Decision Matrix", passed: false, error: err.message });
  }

  return results;
}
