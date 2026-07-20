import type {
  ObjectTypeDefinition,
  FieldDefinition,
  ResolvedObjectTypeSchema,
  ValidationRuleReference,
} from "./types";

export class SchemaInheritanceFlattener {
  /**
   * Detects whether adding/updating an object type with parentTypeId creates a cycle.
   * Throws an error if a cycle is detected.
   */
  static detectCycle(
    typeId: string,
    proposedParentTypeId: string | undefined,
    allTypesMap: Map<string, ObjectTypeDefinition>
  ): void {
    if (!proposedParentTypeId) return;
    if (typeId === proposedParentTypeId) {
      throw new Error(`Circular inheritance detected: Object type '${typeId}' cannot inherit from itself.`);
    }

    const visited = new Set<string>([typeId]);
    let currentId: string | undefined = proposedParentTypeId;

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error(
          `Circular inheritance detected: Type hierarchy cycle found at '${currentId}' when linking '${typeId}' to '${proposedParentTypeId}'.`
        );
      }
      visited.add(currentId);
      const parentType = allTypesMap.get(currentId);
      currentId = parentType?.parentTypeId;
    }
  }

  /**
   * Computes the linear inheritance chain from root parent down to target child type.
   * Example: [WorkItem, Task, Bug]
   */
  static computeInheritanceChain(
    targetTypeId: string,
    allTypesMap: Map<string, ObjectTypeDefinition>
  ): ObjectTypeDefinition[] {
    const chain: ObjectTypeDefinition[] = [];
    const visited = new Set<string>();
    let currentId: string | undefined = targetTypeId;

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error(`Circular inheritance detected in hierarchy involving '${currentId}'.`);
      }
      visited.add(currentId);
      const currentType = allTypesMap.get(currentId);
      if (!currentType) {
        throw new Error(`Object type with ID '${currentId}' not found in registry.`);
      }
      chain.unshift(currentType); // Prepend to build root -> child order
      currentId = currentType.parentTypeId;
    }

    return chain;
  }

  /**
   * Flattens an inheritance chain into a single ResolvedObjectTypeSchema.
   * Merges fields (child fields override parent fields with matching keys).
   */
  static flatten(
    targetType: ObjectTypeDefinition,
    allTypesMap: Map<string, ObjectTypeDefinition>,
    fieldsMap: Map<string, FieldDefinition>
  ): ResolvedObjectTypeSchema {
    const chain = this.computeInheritanceChain(targetType.id, allTypesMap);
    const mergedFields = new Map<string, FieldDefinition>();
    const validationsMap = new Map<string, ValidationRuleReference>();
    const supportedViewIdsSet = new Set<string>();
    const defaultActionIdsSet = new Set<string>();
    let effectiveVersion = 0;

    for (const node of chain) {
      effectiveVersion += node.version;

      // Add supported views and actions
      node.supportedViewIds.forEach((vId) => supportedViewIdsSet.add(vId));
      node.defaultActionIds.forEach((aId) => defaultActionIdsSet.add(aId));

      // Add validation rules
      node.validationRules.forEach((vRule) => validationsMap.set(vRule.ruleId, vRule));

      // Merge field definitions (Child field overrides Parent field by key)
      for (const fieldId of node.fieldDefinitions) {
        const field = fieldsMap.get(fieldId);
        if (field) {
          effectiveVersion += field.version;
          mergedFields.set(field.key, field);
        }
      }
    }

    return {
      typeId: targetType.id,
      tenantId: targetType.tenantId,
      workspaceId: targetType.workspaceId,
      name: targetType.name,
      icon: targetType.icon,
      color: targetType.color,
      description: targetType.description,
      parentTypeId: targetType.parentTypeId,
      inheritanceChain: chain.map((t) => t.id),
      fields: mergedFields,
      validations: Array.from(validationsMap.values()),
      defaultViewId: targetType.defaultViewId || chain[0]?.defaultViewId,
      supportedViewIds: Array.from(supportedViewIdsSet),
      defaultActionIds: Array.from(defaultActionIdsSet),
      systemType: targetType.systemType,
      isExtensible: targetType.isExtensible,
      effectiveVersion,
    };
  }
}
