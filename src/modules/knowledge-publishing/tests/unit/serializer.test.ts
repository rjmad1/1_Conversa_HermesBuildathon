import { describe, it, expect } from "vitest";
import { ExecutivePublisher } from "../../publishers/executive-publisher";
import { JsonRenderer } from "../../serializers/json-renderer";
import { MarkdownRenderer } from "../../serializers/markdown-renderer";
import { HtmlRenderer } from "../../serializers/html-renderer";
import { PlainTextRenderer } from "../../serializers/plain-text-renderer";
import { ValidatedKnowledgePackage } from "../../../cognitive-collaboration/domain/models";

describe("Renderers / Serializers Unit Tests", () => {
  const samplePackage: ValidatedKnowledgePackage = {
    packageId: "pkg_test_456",
    sourceId: "meeting_789",
    sourceType: "Meeting",
    createdAt: 1700000000000,
    manifestVersion: "1.0.0",
    decisions: [
      {
        id: "dec_1",
        title: "Standardize on TypeScript",
        rationale: "Type safety across platform",
        status: "Approved",
        supportingEvidence: [],
        dissentingEvidence: [],
        explanation: "Decision explanation",
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
          originatingSourceId: "meeting_789",
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
    evidencePackageIds: [],
    provenanceSummary: [],
    overallConfidence: {
      evidenceConfidence: 0.95,
      provenanceConfidence: 0.95,
      validationConfidence: 0.95,
      agreementConfidence: 0.95,
      governanceConfidence: 0.95,
      publicationConfidence: 0.95,
      overallConfidence: 0.95,
    },
    privacyClassification: "Internal",
    dataResidencyPolicy: "US",
    policyNotes: [],
    governanceStatus: "Validated",
  };

  it("JsonRenderer creates valid JSON artifact with manifest", async () => {
    const publisher = new ExecutivePublisher();
    const model = await publisher.publish(samplePackage);
    const renderer = new JsonRenderer();

    const artifact = await renderer.render(model);

    expect(artifact.manifest.renderer).toBe("JSON Serialization Renderer");
    expect(artifact.manifest.semanticHash).toBeTruthy();
    expect(artifact.manifest.contentHash).toBeTruthy();
    expect(renderer.validate(artifact)).toBe(true);
  });

  it("MarkdownRenderer creates valid Markdown document with frontmatter", async () => {
    const publisher = new ExecutivePublisher();
    const model = await publisher.publish(samplePackage);
    const renderer = new MarkdownRenderer();

    const artifact = await renderer.render(model);

    expect(artifact.renderedContent).toContain("---");
    expect(artifact.renderedContent).toContain("# Executive Brief: meeting_789");
    expect(renderer.validate(artifact)).toBe(true);
  });

  it("HtmlRenderer creates valid HTML document structure", async () => {
    const publisher = new ExecutivePublisher();
    const model = await publisher.publish(samplePackage);
    const renderer = new HtmlRenderer();

    const artifact = await renderer.render(model);

    expect(artifact.renderedContent).toContain("<!DOCTYPE html>");
    expect(artifact.renderedContent).toContain("Standardize on TypeScript");
    expect(renderer.validate(artifact)).toBe(true);
  });

  it("PlainTextRenderer creates valid Plain Text document", async () => {
    const publisher = new ExecutivePublisher();
    const model = await publisher.publish(samplePackage);
    const renderer = new PlainTextRenderer();

    const artifact = await renderer.render(model);

    expect(artifact.renderedContent).toContain("[PUBLICATION MANIFEST]");
    expect(artifact.renderedContent).toContain("Standardize on TypeScript");
    expect(renderer.validate(artifact)).toBe(true);
  });
});
