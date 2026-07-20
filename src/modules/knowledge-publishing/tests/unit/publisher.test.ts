import { describe, it, expect } from "vitest";
import { ValidatedKnowledgePackage } from "../../../cognitive-collaboration/domain/models";
import { ExecutivePublisher } from "../../publishers/executive-publisher";
import { EngineeringPublisher } from "../../publishers/engineering-publisher";
import { ActionRegisterPublisher } from "../../publishers/action-register-publisher";
import { DecisionRegisterPublisher } from "../../publishers/decision-register-publisher";
import { RiskRegisterPublisher } from "../../publishers/risk-register-publisher";
import { StakeholderBriefPublisher } from "../../publishers/stakeholder-brief-publisher";
import { MachinePublisher } from "../../publishers/machine-publisher";

describe("Knowledge Publishers Unit Tests", () => {
  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_test_123",
    sourceId: "meeting_456",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_1",
        title: "Adopt Microservices Architecture",
        rationale: "Improves modularity and independent deployments",
        status: "Approved",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Decision explanation",
        confidence: {
          evidenceConfidence: 0.9,
          provenanceConfidence: 0.9,
          validationConfidence: 0.9,
          agreementConfidence: 0.9,
          governanceConfidence: 0.9,
          publicationConfidence: 0.9,
          overallConfidence: 0.9,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_456",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_1"],
          timestamp: 1700000000000,
        },
      },
    ],
    actions: [
      {
        id: "act_1",
        title: "Set up Kubernetes cluster",
        owner: "DevOps Team",
        priority: "High",
        status: "Open",
        dueDate: "2026-08-01",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Action explanation",
        confidence: {
          evidenceConfidence: 0.95,
          provenanceConfidence: 0.95,
          validationConfidence: 0.95,
          agreementConfidence: 0.95,
          governanceConfidence: 0.95,
          publicationConfidence: 0.95,
          overallConfidence: 0.95,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_456",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_1"],
          timestamp: 1700000000000,
        },
      },
    ],
    risks: [
      {
        id: "risk_1",
        description: "Migration downtime during cutover",
        severity: "High",
        likelihood: "Medium",
        mitigation: "Blue-green deployment",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Risk explanation",
        confidence: {
          evidenceConfidence: 0.85,
          provenanceConfidence: 0.85,
          validationConfidence: 0.85,
          agreementConfidence: 0.85,
          governanceConfidence: 0.85,
          publicationConfidence: 0.85,
          overallConfidence: 0.85,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_456",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_1"],
          timestamp: 1700000000000,
        },
      },
    ],
    assumptions: [
      {
        id: "asm_1",
        statement: "Cloud infrastructure budget is pre-approved",
        validated: true,
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Assumption explanation",
        confidence: {
          evidenceConfidence: 0.8,
          provenanceConfidence: 0.8,
          validationConfidence: 0.8,
          agreementConfidence: 0.8,
          governanceConfidence: 0.8,
          publicationConfidence: 0.8,
          overallConfidence: 0.8,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_456",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_1"],
          timestamp: 1700000000000,
        },
      },
    ],
    openQuestions: ["What is the migration timeline for legacy DB?"],
    stakeholders: [],
    projects: [],
    relationships: [],
    cognitiveDebt: [],
    evidencePackageIds: ["ev_1", "ev_2"],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 0.92,
      provenanceConfidence: 0.92,
      validationConfidence: 0.92,
      agreementConfidence: 0.92,
      governanceConfidence: 0.92,
      publicationConfidence: 0.92,
      overallConfidence: 0.92,
    },
    privacyClassification: "Internal",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  it("Executive Publisher generates ExecutiveSummary without mutating input", async () => {
    const publisher = new ExecutivePublisher();
    const inputSnapshot = JSON.stringify(samplePackage);

    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("ExecutiveSummary");
    expect(publication.title).toContain("meeting_456");
    expect(publication.keyDecisions.length).toBe(1);
    expect(publication.majorRisks.length).toBe(1);
    expect(publication.strategicActions.length).toBe(1);

    // Verify input non-mutation
    expect(JSON.stringify(samplePackage)).toBe(inputSnapshot);
  });

  it("Engineering Publisher generates EngineeringMinutes", async () => {
    const publisher = new EngineeringPublisher();
    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("EngineeringMinutes");
    expect(publication.technicalDecisions.length).toBe(1);
    expect(publication.openQuestions).toContain("What is the migration timeline for legacy DB?");
    expect(publication.architectureNotes.length).toBeGreaterThan(0);
  });

  it("Action Register Publisher generates ActionRegister", async () => {
    const publisher = new ActionRegisterPublisher();
    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("ActionRegister");
    expect(publication.totalActions).toBe(1);
    expect(publication.actions[0]!.owner).toBe("DevOps Team");
  });

  it("Decision Register Publisher generates DecisionRegister", async () => {
    const publisher = new DecisionRegisterPublisher();
    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("DecisionRegister");
    expect(publication.totalDecisions).toBe(1);
    expect(publication.decisions[0]!.decision).toBe("Adopt Microservices Architecture");
  });

  it("Risk Register Publisher generates RiskRegister", async () => {
    const publisher = new RiskRegisterPublisher();
    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("RiskRegister");
    expect(publication.totalRisks).toBe(1);
    expect(publication.risks[0]!.severity).toBe("High");
  });

  it("Stakeholder Brief Publisher generates customized views per audience", async () => {
    const publisher = new StakeholderBriefPublisher();
    const execBrief = await publisher.publish(samplePackage, { targetAudience: "Executive" });
    const engBrief = await publisher.publish(samplePackage, { targetAudience: "Engineering" });

    expect(execBrief.targetAudience).toBe("Executive");
    expect(engBrief.targetAudience).toBe("Engineering");
    expect(execBrief.keyTakeaways[0]).toContain("Executive Summary");
  });

  it("Machine Publisher generates MachinePackage artifact", async () => {
    const publisher = new MachinePublisher();
    const publication = await publisher.publish(samplePackage);

    expect(publication.publicationType).toBe("MachinePackage");
    expect(publication.packageId).toBe("pub_pkg_pkg_test_123");
    expect(publication.sourcePackage.packageId).toBe("pkg_test_123");
  });
});
