import { AgentEvidencePackage } from "../../../meeting-intelligence/contracts/agent-contract";
import { EvidenceRepository } from "../../repository/evidence-repository";

export async function runEvidenceRepositoryUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const createPkg = (id: string, meetingId: string, agentId: string, confidence: number): AgentEvidencePackage<any> => ({
    packageId: id,
    agentId,
    agentName: agentId,
    agentVersion: "1.0.0",
    meetingId,
    status: "Success",
    payload: { testData: `Payload for ${id}` },
    overallConfidence: confidence,
    evidence: [
      {
        id: `ev_${id}`,
        meetingId,
        speakerId: "spk_1",
        speakerName: "Alice",
        verbatimQuote: "We approve the budget.",
      },
    ],
    reasoning: {
      extractionStrategy: "test",
      provider: "mock",
      model: "test-model",
      promptVersion: "1.0",
      executionDurationMs: 100,
    },
    governance: {
      validationStatus: "Validated",
      privacyClassification: "Internal",
      policyCompliance: true,
      reviewRequired: false,
    },
    quality: {
      ambiguityScore: 0.1,
      completenessScore: 0.9,
      consistencyScore: 0.9,
    },
    confidenceDistribution: {
      sourceConfidence: 0.9,
      modelConfidence: 0.9,
      evidenceStrength: 0.9,
      crossAgentAgreement: 0.9,
      validationConfidence: 0.9,
      overall: confidence,
    },
    createdAt: Date.now(),
  });

  // Test 1: Append and Retrieve
  try {
    const repo = new EvidenceRepository();
    const pkg = createPkg("pkg_1", "m_1", "agent-decision-extraction", 0.9);
    await repo.append(pkg, { workspaceId: "ws_1", topics: ["Budget"] });

    const retrieved = await repo.retrieve("pkg_1");
    if (!retrieved || retrieved.packageId !== "pkg_1") {
      throw new Error("Retrieve returned invalid package or null");
    }
    results.push({ name: "EvidenceRepository: Append and Retrieve", passed: true });
  } catch (err: any) {
    results.push({ name: "EvidenceRepository: Append and Retrieve", passed: false, error: err.message });
  }

  // Test 2: Immutability enforcement
  try {
    const repo = new EvidenceRepository();
    const pkg = createPkg("pkg_1", "m_1", "agent-decision-extraction", 0.9);
    await repo.append(pkg);

    let errorThrown = false;
    try {
      await repo.append(pkg); // Duplicate append
    } catch {
      errorThrown = true;
    }

    if (!errorThrown) throw new Error("Repository allowed mutating/overwriting existing package");
    results.push({ name: "EvidenceRepository: Immutability Enforcement", passed: true });
  } catch (err: any) {
    results.push({ name: "EvidenceRepository: Immutability Enforcement", passed: false, error: err.message });
  }

  // Test 3: Multi-Index Filter
  try {
    const repo = new EvidenceRepository();
    await repo.append(createPkg("pkg_1", "m_1", "agent-decision-extraction", 0.9), { workspaceId: "ws_1", topics: ["Budget"] });
    await repo.append(createPkg("pkg_2", "m_1", "agent-risk", 0.7), { workspaceId: "ws_1", topics: ["Risk"] });
    await repo.append(createPkg("pkg_3", "m_2", "agent-decision-extraction", 0.8), { workspaceId: "ws_2", topics: ["Budget"] });

    const filteredMeeting1 = await repo.filter({ meetingId: "m_1" });
    if (filteredMeeting1.length !== 2) throw new Error(`Expected 2 packages for meeting m_1, got ${filteredMeeting1.length}`);

    const filteredAgentRisk = await repo.filter({ agentId: "agent-risk" });
    if (filteredAgentRisk.length !== 1 || filteredAgentRisk[0]!.packageId !== "pkg_2") {
      throw new Error(`Expected pkg_2 for agent-risk filter`);
    }

    results.push({ name: "EvidenceRepository: Multi-Index Filtering", passed: true });
  } catch (err: any) {
    results.push({ name: "EvidenceRepository: Multi-Index Filtering", passed: false, error: err.message });
  }

  // Test 4: Lineage Tracking & Compare
  try {
    const repo = new EvidenceRepository();
    await repo.append(createPkg("pkg_base", "m_1", "agent-decision-extraction", 0.8), { sourceId: "m_1" });
    await repo.append(createPkg("pkg_corr", "m_1", "agent-decision-extraction", 0.9), {
      sourceId: "m_1",
      parentPackageId: "pkg_base",
      isCorrection: true,
    });

    const lineage = await repo.getLineage("pkg_corr");
    if (lineage.ancestors.length !== 1 || lineage.ancestors[0] !== "pkg_base") {
      throw new Error(`Expected ancestor pkg_base for pkg_corr`);
    }

    const comparison = await repo.compare("pkg_base", "pkg_corr");
    if (comparison.overlapScore === undefined || comparison.fieldDiffs.length === 0) {
      throw new Error("Comparison failed to generate structural report");
    }

    results.push({ name: "EvidenceRepository: Lineage & Compare", passed: true });
  } catch (err: any) {
    results.push({ name: "EvidenceRepository: Lineage & Compare", passed: false, error: err.message });
  }

  return results;
}
