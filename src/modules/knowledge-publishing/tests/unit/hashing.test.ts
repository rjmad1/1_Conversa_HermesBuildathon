import { describe, it, expect } from "vitest";
import { HashingEngine } from "../../domain/hashing";
import { CanonicalSerializer } from "../../domain/canonical-serializer";
import { ExecutivePublisher } from "../../publishers/executive-publisher";
import { MarkdownRenderer } from "../../serializers/markdown-renderer";
import { HtmlRenderer } from "../../serializers/html-renderer";
import { JsonRenderer } from "../../serializers/json-renderer";
import { ValidatedKnowledgePackage } from "../../../cognitive-collaboration/domain/models";

describe("Hashing Engine & Canonical Serializer Unit Tests", () => {
  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_hash_test",
    sourceId: "source_100",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_1",
        title: "Use Antigravity AI Stack",
        rationale: "Enterprise grade performance",
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
          originatingSourceId: "source_100",
          agentIds: ["agent_1"],
          capabilities: ["consensus"],
          evidencePackageIds: ["ev_1"],
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
    evidencePackageIds: ["ev_99"],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 0.98,
      provenanceConfidence: 0.98,
      validationConfidence: 0.98,
      agreementConfidence: 0.98,
      governanceConfidence: 0.98,
      publicationConfidence: 0.98,
      overallConfidence: 0.98,
    },
    privacyClassification: "Confidential",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  it("CanonicalSerializer sorts keys recursively and yields identical output regardless of property order", () => {
    const objA = { z: 1, a: "hello", b: [3, 2, { y: true, x: false }] };
    const objB = { a: "hello", b: [3, 2, { x: false, y: true }], z: 1 };

    const serializedA = CanonicalSerializer.serialize(objA);
    const serializedB = CanonicalSerializer.serialize(objB);

    expect(serializedA).toBe(serializedB);
  });

  it("SemanticHash remains identical across Markdown, HTML, and JSON renderers for the same semantic model", async () => {
    const publisher = new ExecutivePublisher();
    const model = await publisher.publish(samplePackage);

    const jsonRenderer = new JsonRenderer();
    const mdRenderer = new MarkdownRenderer();
    const htmlRenderer = new HtmlRenderer();

    const jsonArtifact = await jsonRenderer.render(model);
    const mdArtifact = await mdRenderer.render(model);
    const htmlArtifact = await htmlRenderer.render(model);

    // Renderer Independence: SemanticHash MUST be identical!
    expect(jsonArtifact.manifest.semanticHash).toBe(mdArtifact.manifest.semanticHash);
    expect(jsonArtifact.manifest.semanticHash).toBe(htmlArtifact.manifest.semanticHash);

    // ContentHash MUST reflect actual presentation format byte stream differences
    expect(jsonArtifact.manifest.contentHash).not.toBe(mdArtifact.manifest.contentHash);
  });

  it("ProvenanceHash is deterministic for identical ValidatedKnowledgePackage", () => {
    const hash1 = HashingEngine.computeProvenanceHash(samplePackage, "TestPublisher");
    const hash2 = HashingEngine.computeProvenanceHash(samplePackage, "TestPublisher");

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });
});
