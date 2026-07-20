import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { DecisionRegisterPublication } from "../domain/models";

export class DecisionRegisterPublisher implements IKnowledgePublisher<DecisionRegisterPublication> {
  public readonly metadata: PublisherMetadata = {
    id: "decision-register-publisher",
    name: "Decision Register Publisher",
    version: "1.0.0",
    publicationType: "DecisionRegister",
    targetAudience: "Governance & Architecture Board",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<DecisionRegisterPublication> {
    const rawDecisions = packageData.decisions || [];

    const decisions = rawDecisions.map((d: any) => ({
      id: d.id,
      decision: d.title || d.decision,
      rationale: d.rationale || "N/A",
      supportingEvidenceCount: d.supportingEvidence?.length ?? 0,
      confidence: d.confidence?.overallConfidence ?? 1.0,
      date: packageData.createdAt,
      stakeholders: d.stakeholders || (d.owner ? [d.owner] : []),
    }));

    return {
      publicationType: "DecisionRegister",
      sourceId: packageData.sourceId,
      decisions,
      totalDecisions: decisions.length,
    };
  }
}
