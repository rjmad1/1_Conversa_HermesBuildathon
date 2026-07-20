import type { CreateGraphEdgeInput, RelationshipTypeConfig } from "../domain/types";
import type { IGraphRepository } from "../domain/ports";
import type { IKnowledgeRepository } from "../../knowledge/repository";
import type { ValidationResult, ValidationError } from "../../metadata/domain/types";
import { GraphPolicyRegistry } from "../domain/policies/policy-registry";
import type { GraphValidationContext } from "../domain/policies/validation-policy";
import { GraphEventDispatcher } from "../domain/events/graph-events";

export class GraphValidationService {
  constructor(
    private graphRepository: IGraphRepository,
    private knowledgeRepository?: IKnowledgeRepository,
    private relationshipTypeConfigs?: Map<string, RelationshipTypeConfig>
  ) {}

  async validateEdgeCreation(
    tenantId: string,
    workspaceId: string,
    input: CreateGraphEdgeInput
  ): Promise<ValidationResult> {
    const relConfig = this.relationshipTypeConfigs?.get(input.relationType);

    const context: GraphValidationContext = {
      tenantId,
      workspaceId,
      input,
      relationshipConfig: relConfig,
      graphRepository: this.graphRepository,
      knowledgeRepository: this.knowledgeRepository,
    };

    const allErrors: ValidationError[] = [];
    const policies = GraphPolicyRegistry.getInstance().getPolicies();

    for (const policy of policies) {
      const res = await policy.validate(context);
      if (!res.valid) {
        allErrors.push(...res.errors);
      }
    }

    const valid = allErrors.length === 0;

    await GraphEventDispatcher.dispatch({
      type: "RelationshipValidated",
      tenantId,
      workspaceId,
      sourceId: input.sourceId,
      targetId: input.targetId,
      relationType: input.relationType,
      valid,
      timestamp: Date.now(),
    });

    return {
      valid,
      errors: allErrors,
    };
  }
}
