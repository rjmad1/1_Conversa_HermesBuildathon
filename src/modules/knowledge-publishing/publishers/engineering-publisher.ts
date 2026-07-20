import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { EngineeringPublication } from "../domain/models";

export class EngineeringPublisher implements IKnowledgePublisher<EngineeringPublication> {
  public readonly metadata: PublisherMetadata = {
    id: "engineering-publisher",
    name: "Engineering Minutes Publisher",
    version: "1.0.0",
    publicationType: "EngineeringMinutes",
    targetAudience: "Engineering & Technical Teams",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<EngineeringPublication> {
    const technicalDecisions = packageData.decisions || [];
    const engineeringTasks = packageData.actions || [];
    const dependencies = packageData.relationships || [];
    const assumptions = packageData.assumptions || [];
    const openQuestions = packageData.openQuestions || [];

    const architectureNotes = [
      ...technicalDecisions.map((d: any) => `Architecture Choice: ${d.title || d.decision} - ${d.rationale}`),
      ...assumptions.map((a) => `Assumption: ${a.statement}`),
    ];

    return {
      publicationType: "EngineeringMinutes",
      sourceId: packageData.sourceId,
      title: `Engineering Technical Minutes: ${packageData.sourceId}`,
      technicalDecisions,
      architectureNotes,
      openQuestions,
      engineeringTasks,
      dependencies,
      assumptions,
      overallConfidence: packageData.overallConfidence,
    };
  }
}
