import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { IKnowledgePublisher, PublisherMetadata } from "../contracts/publisher-contract";
import { ActionRegisterPublication } from "../domain/models";

export class ActionRegisterPublisher implements IKnowledgePublisher<ActionRegisterPublication> {
  public readonly metadata: PublisherMetadata = {
    id: "action-register-publisher",
    name: "Action Register Publisher",
    version: "1.0.0",
    publicationType: "ActionRegister",
    targetAudience: "Project & Operations Managers",
  };

  public async publish(
    packageData: ValidatedKnowledgePackage,
    options?: Record<string, unknown>
  ): Promise<ActionRegisterPublication> {
    const rawActions = packageData.actions || [];

    const actions = rawActions.map((a: any) => ({
      id: a.id,
      task: a.title || a.description || "Action item",
      owner: a.owner || "Unassigned",
      dueDate: a.dueDate,
      priority: (a.priority || "Medium") as "Low" | "Medium" | "High" | "Urgent",
      status: (a.status || "Open") as "Open" | "InProgress" | "Completed" | "Deferred",
      dependencies: a.dependencies || [],
      confidence: a.confidence?.overallConfidence ?? 1.0,
    }));

    return {
      publicationType: "ActionRegister",
      sourceId: packageData.sourceId,
      actions,
      totalActions: actions.length,
    };
  }
}
