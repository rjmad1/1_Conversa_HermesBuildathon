import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { AudienceType, StakeholderBriefPublication } from "../domain/models";

export class StakeholderBriefPublisher implements IKnowledgePublisher<StakeholderBriefPublication> {
  public readonly metadata: PublisherMetadata = {
    id: "stakeholder-brief-publisher",
    name: "Stakeholder Brief Publisher",
    version: "1.0.0",
    publicationType: "StakeholderBrief",
    targetAudience: "Multi-Stakeholder Teams",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<StakeholderBriefPublication> {
    const audience = (options?.targetAudience as AudienceType) || "Executive";

    let relevantDecisions = packageData.decisions || [];
    let relevantActions = packageData.actions || [];
    let relevantRisks = packageData.risks || [];
    const takeaways: string[] = [];

    switch (audience) {
      case "Executive":
        relevantDecisions = relevantDecisions.filter((d: any) => d.status === "Approved" || d.importance === "High" || d.importance === "Critical");
        relevantRisks = relevantRisks.filter((r: any) => r.severity === "High" || r.severity === "Critical");
        takeaways.push(`Executive Summary for source ${packageData.sourceId}`);
        takeaways.push(`${relevantDecisions.length} high-impact decisions and ${relevantRisks.length} major risks.`);
        break;

      case "Engineering":
        takeaways.push(`Engineering Focus for ${packageData.sourceId}`);
        takeaways.push(`${relevantActions.length} engineering action items and ${packageData.openQuestions?.length ?? 0} open questions.`);
        break;

      case "Product":
        takeaways.push(`Product Brief for ${packageData.sourceId}`);
        takeaways.push(`Key decisions affecting roadmap: ${relevantDecisions.length}`);
        break;

      case "Operations":
        takeaways.push(`Operations Overview for ${packageData.sourceId}`);
        takeaways.push(`Action items requiring operational deployment: ${relevantActions.length}`);
        break;

      case "CustomerSuccess":
        relevantRisks = relevantRisks.filter((r: any) => r.severity === "High" || r.severity === "Critical");
        takeaways.push(`Customer Impact Brief for ${packageData.sourceId}`);
        takeaways.push(`Customer-facing changes & risks: ${relevantRisks.length}`);
        break;

      default:
        takeaways.push(`General Brief for ${packageData.sourceId}`);
    }

    return {
      publicationType: "StakeholderBrief",
      sourceId: packageData.sourceId,
      targetAudience: audience,
      summary: `Tailored ${audience} Brief derived from ValidatedKnowledgePackage ${packageData.packageId}`,
      relevantDecisions,
      relevantActions,
      relevantRisks,
      keyTakeaways: takeaways,
    };
  }
}
