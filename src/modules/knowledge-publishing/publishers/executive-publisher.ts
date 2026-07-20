import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { ExecutivePublication } from "../domain/models";

export class ExecutivePublisher implements IKnowledgePublisher<ExecutivePublication> {
  public readonly metadata: PublisherMetadata = {
    id: "executive-publisher",
    name: "Executive Summary Publisher",
    version: "1.0.0",
    publicationType: "ExecutiveSummary",
    targetAudience: "Executive Leadership",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<ExecutivePublication> {
    const keyDecisions = (packageData.decisions || []).filter(
      (d: any) => d.importance === "High" || d.importance === "Critical" || !d.importance
    );
    const majorRisks = (packageData.risks || []).filter(
      (r: any) => r.severity === "High" || r.severity === "Critical" || !r.severity
    );
    const strategicActions = packageData.actions || [];

    const overviewText = packageData.decisions?.length > 0
      ? `Executive summary for source ${packageData.sourceId} (${packageData.sourceType}). ${packageData.decisions.length} key decision(s) agreed and ${packageData.actions.length} action item(s) captured.`
      : `Executive summary for source ${packageData.sourceId} (${packageData.sourceType}). Overview generated from validated knowledge package.`;

    const followUps = [
      ...strategicActions.map((a: any) => `Action: ${a.title || a.description} (${a.owner || "Unassigned"})`),
      ...(packageData.openQuestions || []).map((q) => `Open Question: ${q}`),
    ];

    return {
      publicationType: "ExecutiveSummary",
      sourceId: packageData.sourceId,
      title: `Executive Brief: ${packageData.sourceId}`,
      executiveOverview: overviewText,
      keyDecisions,
      majorRisks,
      strategicActions,
      businessImpact: {
        resourceImpact: `High priority actions: ${strategicActions.filter((a: any) => a.priority === "High" || a.priority === "Urgent").length}`,
        timelineImpact: `Total pending actions: ${strategicActions.length}`,
        strategicAlignment: `Validated knowledge with composite confidence ${(packageData.overallConfidence?.overallConfidence ?? 1.0).toFixed(2)}`,
      },
      followUps,
      overallConfidence: packageData.overallConfidence,
      privacyClassification: packageData.privacyClassification,
    };
  }
}
