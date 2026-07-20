import { AgentEvidencePackage } from "../../../meeting-intelligence/contracts/agent-contract";
import { ConsensusGenerator } from "../../services/consensus-generator";

export async function runConsensusGeneratorUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
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
    evidence: [
      { id: `ev_${agentId}`, meetingId: "m_1", speakerName: "Alice", verbatimQuote: "We approve $50k budget." }
    ],
    reasoning: { extractionStrategy: "test", provider: "mock", model: "mock", promptVersion: "1.0", executionDurationMs: 10 },
    governance: { validationStatus: "Validated", privacyClassification: "Internal", policyCompliance: true, reviewRequired: false },
    quality: { ambiguityScore: 0.1, completenessScore: 0.9, consistencyScore: 0.9 },
    confidenceDistribution: { sourceConfidence: 0.9, modelConfidence: 0.9, evidenceStrength: 0.9, crossAgentAgreement: 0.9, validationConfidence: 0.9, overall: 0.9 },
    createdAt: Date.now(),
  });

  try {
    const generator = new ConsensusGenerator();

    const decPkg = makePkg("agent-decision-extraction", {
      decisions: [{ title: "Approve Architecture Migration", topic: "Architecture", owner: "Bob" }]
    });
    const actPkg = makePkg("agent-action-extraction", {
      actions: [
        { title: "Refactor database schema", owner: "Charlie", priority: "High" },
        { title: "Review security docs", owner: "Unassigned", priority: "Medium" }
      ]
    });
    const riskPkg = makePkg("agent-risk", {
      risks: [{ description: "Migration latency spike risk", severity: "High", likelihood: "Medium" }]
    });
    const diarPkg = makePkg("agent-diarization", {
      speakers: [{ speakerId: "spk_1", name: "Alice", role: "Architect" }]
    });

    const report = {
      reportId: "rep_1",
      sourceId: "m_1",
      evaluatedPackageIds: ["pkg_1"],
      agreementScore: 0.9,
      contradictionScore: 0.1,
      completenessScore: 0.9,
      ambiguityScore: 0.1,
      missingEvidenceCapabilities: [],
      unresolvedConflicts: [],
      confidenceAdjustments: {},
      recommendedAction: "ConsensusPossible" as const,
      evaluatedAt: Date.now(),
    };

    const vkp = await generator.generateConsensus("m_1", [decPkg, actPkg, riskPkg, diarPkg], report);

    if (!vkp || vkp.packageId === undefined) throw new Error("ConsensusGenerator returned invalid package");

    if (vkp.decisions.length !== 1 || vkp.decisions[0]!.title !== "Approve Architecture Migration") {
      throw new Error("Canonical decision synthesis failed");
    }

    if (vkp.actions.length !== 2) {
      throw new Error(`Expected 2 canonical actions, got ${vkp.actions.length}`);
    }

    if (vkp.risks.length !== 1 || vkp.risks[0]!.severity !== "High") {
      throw new Error("Canonical risk synthesis failed");
    }

    // Check Cognitive Debt item for Unassigned action
    const debtOwnerItem = vkp.cognitiveDebt.find((cd) => cd.topic === "Action Ownership");
    if (!debtOwnerItem) {
      throw new Error("Cognitive Debt failed to capture unassigned action item");
    }

    if (!vkp.overallConfidence || vkp.overallConfidence.publicationConfidence === undefined) {
      throw new Error("Multi-dimensional confidence distribution missing from ValidatedKnowledgePackage");
    }

    results.push({ name: "ConsensusGenerator: Canonical Synthesis & Cognitive Debt", passed: true });
  } catch (err: any) {
    results.push({ name: "ConsensusGenerator: Canonical Synthesis & Cognitive Debt", passed: false, error: err.message });
  }

  return results;
}
