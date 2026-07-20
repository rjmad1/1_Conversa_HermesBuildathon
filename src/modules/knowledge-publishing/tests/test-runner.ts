import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";

import { ExecutivePublisher } from "../publishers/executive-publisher";
import { EngineeringPublisher } from "../publishers/engineering-publisher";
import { ActionRegisterPublisher } from "../publishers/action-register-publisher";
import { DecisionRegisterPublisher } from "../publishers/decision-register-publisher";
import { RiskRegisterPublisher } from "../publishers/risk-register-publisher";
import { StakeholderBriefPublisher } from "../publishers/stakeholder-brief-publisher";
import { MachinePublisher } from "../publishers/machine-publisher";

import { JsonRenderer } from "../serializers/json-renderer";
import { MarkdownRenderer } from "../serializers/markdown-renderer";
import { HtmlRenderer } from "../serializers/html-renderer";
import { PlainTextRenderer } from "../serializers/plain-text-renderer";

import { HashingEngine } from "../domain/hashing";
import { CanonicalSerializer } from "../domain/canonical-serializer";
import { KnowledgePublishingService } from "../application/publishing-service";
import { PlatformEventBus } from "../../../platform/events";
import { COGNITIVE_COLLABORATION_EVENTS } from "../../cognitive-collaboration/events/events";
import { KNOWLEDGE_PUBLISHING_EVENTS } from "../events/events";

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ PASSED: ${name}`);
    return true;
  } catch (err: any) {
    console.log(`  ✗ FAILED: ${name} -> Error: ${err.message || err}`);
    return false;
  }
}

export async function runAllKnowledgePublishingTests(): Promise<boolean> {
  console.log("===============================================================");
  console.log("    Enterprise Knowledge Publishing Layer Test Suite           ");
  console.log("===============================================================\n");

  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_test_999",
    sourceId: "meeting_999",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_1",
        title: "Standardize on TypeScript & Antigravity OS",
        rationale: "Enterprise grade architecture",
        status: "Approved",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Decision explanation",
        confidence: {
          evidenceConfidence: 0.98,
          provenanceConfidence: 0.98,
          validationConfidence: 0.98,
          agreementConfidence: 0.98,
          governanceConfidence: 0.98,
          publicationConfidence: 0.98,
          overallConfidence: 0.98,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_999",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_100"],
          timestamp: 1700000000000,
        },
      },
    ],
    actions: [
      {
        id: "act_1",
        title: "Deploy Phase 3 Publishing Engine",
        owner: "AI Team",
        priority: "Urgent",
        status: "Open",
        dueDate: "2026-07-21",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Action explanation",
        confidence: {
          evidenceConfidence: 0.99,
          provenanceConfidence: 0.99,
          validationConfidence: 0.99,
          agreementConfidence: 0.99,
          governanceConfidence: 0.99,
          publicationConfidence: 0.99,
          overallConfidence: 0.99,
        },
        provenance: {
          originatingPipeline: "MeetingPipeline",
          originatingSourceId: "meeting_999",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_100"],
          timestamp: 1700000000000,
        },
      },
    ],
    risks: [
      {
        id: "risk_1",
        description: "Downstream system schema mismatch",
        severity: "High",
        likelihood: "Low",
        mitigation: "Strict machine package schema validation",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Risk explanation",
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
          originatingSourceId: "meeting_999",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_100"],
          timestamp: 1700000000000,
        },
      },
    ],
    assumptions: [
      {
        id: "asm_1",
        statement: "AegisOS boundary remains un-mutated",
        validated: true,
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Assumption explanation",
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
          originatingSourceId: "meeting_999",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_100"],
          timestamp: 1700000000000,
        },
      },
    ],
    openQuestions: ["When will Universal Inbox Phase 4 commence?"],
    stakeholders: [],
    projects: [],
    relationships: [],
    cognitiveDebt: [],
    evidencePackageIds: ["ev_100"],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 0.97,
      provenanceConfidence: 0.97,
      validationConfidence: 0.97,
      agreementConfidence: 0.97,
      governanceConfidence: 0.97,
      publicationConfidence: 0.97,
      overallConfidence: 0.97,
    },
    privacyClassification: "Internal",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    const res = await runTest(name, fn);
    if (res) passed++;
  }

  console.log("--- [Suite] Unit: Publishers ---");

  await test("Executive Publisher generates ExecutiveSummary without mutating input", async () => {
    const pub = new ExecutivePublisher();
    const snapshot = JSON.stringify(samplePackage);
    const result = await pub.publish(samplePackage);
    if (result.publicationType !== "ExecutiveSummary") throw new Error("Invalid publicationType");
    if (JSON.stringify(samplePackage) !== snapshot) throw new Error("Input mutated!");
  });

  await test("Engineering Publisher generates EngineeringMinutes", async () => {
    const pub = new EngineeringPublisher();
    const result = await pub.publish(samplePackage);
    if (result.publicationType !== "EngineeringMinutes") throw new Error("Invalid publicationType");
  });

  await test("Action Register Publisher generates ActionRegister", async () => {
    const pub = new ActionRegisterPublisher();
    const result = await pub.publish(samplePackage);
    if (result.totalActions !== 1) throw new Error("Action count mismatch");
  });

  await test("Decision Register Publisher generates DecisionRegister", async () => {
    const pub = new DecisionRegisterPublisher();
    const result = await pub.publish(samplePackage);
    if (result.totalDecisions !== 1) throw new Error("Decision count mismatch");
  });

  await test("Risk Register Publisher generates RiskRegister", async () => {
    const pub = new RiskRegisterPublisher();
    const result = await pub.publish(samplePackage);
    if (result.totalRisks !== 1) throw new Error("Risk count mismatch");
  });

  await test("Stakeholder Brief Publisher generates brief", async () => {
    const pub = new StakeholderBriefPublisher();
    const result = await pub.publish(samplePackage, { targetAudience: "Executive" });
    if (result.targetAudience !== "Executive") throw new Error("Audience mismatch");
  });

  await test("Machine Publisher generates MachinePackage", async () => {
    const pub = new MachinePublisher();
    const result = await pub.publish(samplePackage);
    if (result.publicationType !== "MachinePackage") throw new Error("Machine package type mismatch");
  });

  console.log("\n--- [Suite] Unit: Serializers & Hashing ---");

  await test("CanonicalSerializer sorts keys recursively", () => {
    const s1 = CanonicalSerializer.serialize({ z: 1, a: 2 });
    const s2 = CanonicalSerializer.serialize({ a: 2, z: 1 });
    if (s1 !== s2) throw new Error("Key sorting failed");
  });

  await test("SemanticHash is identical across Markdown, HTML, and JSON renderers", async () => {
    const pub = new ExecutivePublisher();
    const model = await pub.publish(samplePackage);
    const jsonArt = await new JsonRenderer().render(model);
    const mdArt = await new MarkdownRenderer().render(model);
    const htmlArt = await new HtmlRenderer().render(model);

    if (jsonArt.manifest.semanticHash !== mdArt.manifest.semanticHash) throw new Error("SemanticHash JSON != MD");
    if (jsonArt.manifest.semanticHash !== htmlArt.manifest.semanticHash) throw new Error("SemanticHash JSON != HTML");
  });

  await test("Renderers validate content hash successfully", async () => {
    const pub = new ExecutivePublisher();
    const model = await pub.publish(samplePackage);
    const renderer = new JsonRenderer();
    const art = await renderer.render(model);
    if (!renderer.validate(art)) throw new Error("Validation failed");
  });

  console.log("\n--- [Suite] Integration & Boundaries ---");

  await test("KnowledgePublishingService publishes package across profile", async () => {
    const service = new KnowledgePublishingService();
    const artifacts = await service.publish(samplePackage, "FULL");
    if (artifacts.length === 0) throw new Error("No artifacts generated");
  });

  await test("Event bus auto-publishes on KnowledgePackagePublished event", async () => {
    const eventBus = new PlatformEventBus();
    const service = new KnowledgePublishingService(eventBus);

    let eventFired = false;
    eventBus.subscribe(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_GENERATED, () => {
      eventFired = true;
    });

    await eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.KNOWLEDGE_PACKAGE_PUBLISHED, {
      sourceId: samplePackage.sourceId,
      packageId: samplePackage.packageId,
      knowledgePackage: samplePackage,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    if (!eventFired) throw new Error("PUBLICATION_GENERATED event not fired");
  });

  console.log("\n===============================================================");
  console.log(`SUMMARY: Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  console.log("===============================================================");

  return passed === total;
}

runAllKnowledgePublishingTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Knowledge Publishing Test Runner fatal error:", err);
    process.exit(1);
  });
