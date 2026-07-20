import { describe, it, expect } from "vitest";
import { KnowledgePublishingService } from "../../application/publishing-service";
import { ValidatedKnowledgePackage } from "../../../cognitive-collaboration/domain/models";

describe("Architecture Boundary Tests - Knowledge Publishing Layer", () => {
  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_boundary_1",
    sourceId: "meeting_boundary_2",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_b",
        title: "Zero side-effects boundary rule",
        rationale: "Publishing layer presentation strictly separate from memory/graph",
        status: "Approved",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Decision explanation",
        confidence: {
          evidenceConfidence: 1.0,
          provenanceConfidence: 1.0,
          validationConfidence: 1.0,
          agreementConfidence: 1.0,
          governanceConfidence: 1.0,
          publicationConfidence: 1.0,
          overallConfidence: 1.0,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_boundary_2",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_boundary"],
          timestamp: 1700000000000,
        },
      },
    ],
    actions: [],
    risks: [],
    assumptions: [],
    openQuestions: [],
    stakeholders: [],
    projects: [],
    relationships: [],
    cognitiveDebt: [],
    evidencePackageIds: [],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 1.0,
      provenanceConfidence: 1.0,
      validationConfidence: 1.0,
      agreementConfidence: 1.0,
      governanceConfidence: 1.0,
      publicationConfidence: 1.0,
      overallConfidence: 1.0,
    },
    privacyClassification: "Internal",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  it("Ensures publishing produces output without mutating input or external state", async () => {
    const service = new KnowledgePublishingService();
    const originalString = JSON.stringify(samplePackage);

    const artifacts = await service.publish(samplePackage, "FULL");

    expect(artifacts.length).toBeGreaterThan(0);
    // Input must remain pristine and un-mutated
    expect(JSON.stringify(samplePackage)).toBe(originalString);
  });

  it("Generates schema-compliant MachinePackage artifact for downstream AegisOS integration", async () => {
    const service = new KnowledgePublishingService();
    const machineModel = await service.generateSemanticModel<any>(samplePackage, "machine-publisher");

    expect(machineModel.publicationType).toBe("MachinePackage");
    expect(machineModel.sourcePackage.packageId).toBe("pkg_boundary_1");
    expect(machineModel.metadata.publishedBy).toBe("Conversa.SemanticPublicationEngine");
  });
});
