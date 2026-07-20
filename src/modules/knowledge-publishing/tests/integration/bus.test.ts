import { describe, it, expect } from "vitest";
import { PlatformEventBus } from "../../../../platform/events";
import { COGNITIVE_COLLABORATION_EVENTS } from "../../../cognitive-collaboration/events/events";
import { ValidatedKnowledgePackage } from "../../../cognitive-collaboration/domain/models";
import { SemanticPublicationBus } from "../../application/semantic-publication-bus";
import { KNOWLEDGE_PUBLISHING_EVENTS } from "../../events/events";

describe("Semantic Publication Bus Integration Tests", () => {
  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_int_777",
    sourceId: "meeting_int_888",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_bus",
        title: "Approve Enterprise Architecture",
        rationale: "Validated by board",
        status: "Approved",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Decision explanation",
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
          originatingSourceId: "meeting_int_888",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_bus_1"],
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
    evidencePackageIds: ["ev_bus_1"],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 0.99,
      provenanceConfidence: 0.99,
      validationConfidence: 0.99,
      agreementConfidence: 0.99,
      governanceConfidence: 0.99,
      publicationConfidence: 0.99,
      overallConfidence: 0.99,
    },
    privacyClassification: "Internal",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  it("Automatically executes publishers and emits publication events when KnowledgePackagePublished is fired", async () => {
    const eventBus = new PlatformEventBus();
    const publicationBus = new SemanticPublicationBus(eventBus);
    publicationBus.startListening();

    const generatedEvents: any[] = [];
    eventBus.subscribe(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_GENERATED, (evt) => {
      generatedEvents.push(evt);
    });

    // Emit event from Cognitive Collaboration
    await eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.KNOWLEDGE_PACKAGE_PUBLISHED, {
      sourceId: samplePackage.sourceId,
      packageId: samplePackage.packageId,
      knowledgePackage: samplePackage,
    });

    // Allow async handlers to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generatedEvents.length).toBeGreaterThan(0);
    const firstEvent = generatedEvents[0];
    expect(firstEvent.payload.sourcePackageId).toBe("pkg_int_777");
    expect(firstEvent.payload.manifest.semanticHash).toBeTruthy();

    publicationBus.stopListening();
  });
});
