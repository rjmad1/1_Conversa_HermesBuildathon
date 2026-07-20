import type { CreateGraphEdgeInput, RelationshipTypeConfig } from "../types";
import type { IGraphRepository } from "../ports";
import type { IKnowledgeRepository } from "../../../knowledge/repository";
import type { ValidationResult, ValidationError } from "../../../metadata/domain/types";

export interface GraphValidationContext {
  tenantId: string;
  workspaceId: string;
  input: CreateGraphEdgeInput;
  relationshipConfig?: RelationshipTypeConfig;
  graphRepository: IGraphRepository;
  knowledgeRepository?: IKnowledgeRepository;
}

export interface IGraphValidationPolicy {
  readonly name: string;
  validate(ctx: GraphValidationContext): Promise<ValidationResult>;
}

/** Policy 1: Workspace & Object Existence Policy */
export class BoundaryAndExistencePolicy implements IGraphValidationPolicy {
  readonly name = "BoundaryAndExistencePolicy";

  async validate(ctx: GraphValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (ctx.input.tenantId !== ctx.tenantId || ctx.input.workspaceId !== ctx.workspaceId) {
      errors.push({
        code: "INVALID_BOUNDARY",
        message: "Edge source/target workspace boundaries do not match validation context.",
        severity: "error",
      });
    }

    if (ctx.input.sourceId === ctx.input.targetId && !ctx.relationshipConfig?.allowSelfReference) {
      errors.push({
        code: "INVALID_SELF_REFERENCE",
        message: `Self-referential edges are not allowed for relation type '${ctx.input.relationType}'.`,
        severity: "error",
      });
    }

    if (ctx.knowledgeRepository) {
      const sourceObj = await ctx.knowledgeRepository.findById(ctx.input.sourceId);
      const targetObj = await ctx.knowledgeRepository.findById(ctx.input.targetId);

      if (!sourceObj) {
        errors.push({
          code: "SOURCE_NOT_FOUND",
          message: `Source KnowledgeObject '${ctx.input.sourceId}' does not exist.`,
          severity: "error",
        });
      }
      if (!targetObj) {
        errors.push({
          code: "TARGET_NOT_FOUND",
          message: `Target KnowledgeObject '${ctx.input.targetId}' does not exist.`,
          severity: "error",
        });
      }

      if (sourceObj && targetObj && ctx.relationshipConfig) {
        const allowedSources = ctx.relationshipConfig.allowedSourceTypes || ["*"];
        const allowedTargets = ctx.relationshipConfig.allowedTargetTypes || ["*"];

        if (!allowedSources.includes("*") && !allowedSources.includes(sourceObj.type)) {
          errors.push({
            code: "DISALLOWED_SOURCE_TYPE",
            message: `Source type '${sourceObj.type}' is not allowed for relationship '${ctx.input.relationType}'. Allowed: ${allowedSources.join(", ")}`,
            severity: "error",
          });
        }

        if (!allowedTargets.includes("*") && !allowedTargets.includes(targetObj.type)) {
          errors.push({
            code: "DISALLOWED_TARGET_TYPE",
            message: `Target type '${targetObj.type}' is not allowed for relationship '${ctx.input.relationType}'. Allowed: ${allowedTargets.join(", ")}`,
            severity: "error",
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/** Policy 2: Cardinality Policy */
export class CardinalityPolicy implements IGraphValidationPolicy {
  readonly name = "CardinalityPolicy";

  async validate(ctx: GraphValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const cardinality = ctx.relationshipConfig?.cardinality || "N:M";

    if (cardinality === "1:1" || cardinality === "N:1") {
      const existingIncoming = await ctx.graphRepository.findEdges({
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId,
        targetId: ctx.input.targetId,
        relationTypes: [ctx.input.relationType],
        status: "active",
      });

      if (existingIncoming.length > 0 && existingIncoming[0]?.sourceId !== ctx.input.sourceId) {
        errors.push({
          code: "CARDINALITY_VIOLATION_TARGET",
          message: `Target object '${ctx.input.targetId}' already has a 1:1 or N:1 relationship of type '${ctx.input.relationType}'.`,
          severity: "error",
        });
      }
    }

    if (cardinality === "1:1" || cardinality === "1:N") {
      const existingOutgoing = await ctx.graphRepository.findEdges({
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId,
        sourceId: ctx.input.sourceId,
        relationTypes: [ctx.input.relationType],
        status: "active",
      });

      if (existingOutgoing.length > 0 && existingOutgoing[0]?.targetId !== ctx.input.targetId) {
        errors.push({
          code: "CARDINALITY_VIOLATION_SOURCE",
          message: `Source object '${ctx.input.sourceId}' already has a 1:1 or 1:N relationship of type '${ctx.input.relationType}'.`,
          severity: "error",
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

/** Policy 3: Topology & Acyclic Cycle Detection Policy */
export class TopologyCyclePolicy implements IGraphValidationPolicy {
  readonly name = "TopologyCyclePolicy";

  async validate(ctx: GraphValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const allowCycles = ctx.relationshipConfig?.allowCycles ?? true;

    // DAG enforcement if allowCycles is false
    if (!allowCycles) {
      // Check if target node can reach source node via outgoing edges of same relationType
      const visited = new Set<string>();
      const queue = [ctx.input.targetId];
      let cycleDetected = false;

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === ctx.input.sourceId) {
          cycleDetected = true;
          break;
        }
        visited.add(current);

        const outgoing = await ctx.graphRepository.getChildren(
          ctx.tenantId,
          ctx.workspaceId,
          current,
          ctx.input.relationType
        );

        for (const edge of outgoing) {
          if (!visited.has(edge.targetId)) {
            queue.push(edge.targetId);
          }
        }
      }

      if (cycleDetected) {
        errors.push({
          code: "CYCLIC_RELATIONSHIP_PROHIBITED",
          message: `Creating edge ${ctx.input.sourceId} -> ${ctx.input.targetId} introduces a forbidden cycle for acyclic relationship '${ctx.input.relationType}'.`,
          severity: "error",
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
