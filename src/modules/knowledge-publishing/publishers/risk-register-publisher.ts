import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { RiskRegisterPublication } from "../domain/models";

export class RiskRegisterPublisher implements IKnowledgePublisher<RiskRegisterPublication> {
  public readonly metadata: PublisherMetadata = {
    id: "risk-register-publisher",
    name: "Risk Register Publisher",
    version: "1.0.0",
    publicationType: "RiskRegister",
    targetAudience: "Risk & Compliance Officers",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<RiskRegisterPublication> {
    const rawRisks = packageData.risks || [];

    const risks = rawRisks.map((r: any) => ({
      id: r.id,
      risk: r.description,
      severity: (r.severity || "Medium") as "Low" | "Medium" | "High" | "Critical",
      likelihood: (r.likelihood || "Medium") as "Low" | "Medium" | "High",
      evidenceCount: r.supportingEvidence?.length ?? 0,
      mitigation: r.mitigation,
      owner: r.owner,
      confidence: r.confidence?.overallConfidence ?? 1.0,
    }));

    return {
      publicationType: "RiskRegister",
      sourceId: packageData.sourceId,
      risks,
      totalRisks: risks.length,
    };
  }
}
