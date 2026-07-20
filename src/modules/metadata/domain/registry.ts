import type {
  ObjectTypeDefinition,
  FieldDefinition,
  ResolvedObjectTypeSchema,
  ObjectTemplate,
} from "./types";
import type {
  IObjectTypeRepository,
  IFieldDefinitionRepository,
  ITemplateRepository,
} from "./ports";
import { SchemaInheritanceFlattener } from "./inheritance";

export class RegistryService {
  private schemaCache = new Map<string, ResolvedObjectTypeSchema>(); // typeId -> ResolvedObjectTypeSchema
  private typesCache = new Map<string, ObjectTypeDefinition>();      // typeId -> ObjectTypeDefinition
  private fieldsCache = new Map<string, FieldDefinition>();            // fieldId -> FieldDefinition

  constructor(
    private objectTypeRepo: IObjectTypeRepository,
    private fieldRepo: IFieldDefinitionRepository,
    private templateRepo?: ITemplateRepository
  ) {}

  /**
   * Initializes or refreshes the in-memory metadata registry cache for a workspace.
   */
  async initializeWorkspace(tenantId: string, workspaceId: string): Promise<void> {
    const objectTypes = await this.objectTypeRepo.listByWorkspace(tenantId, workspaceId);
    const fields = await this.fieldRepo.listByWorkspace(tenantId, workspaceId);

    this.typesCache.clear();
    this.fieldsCache.clear();
    this.schemaCache.clear();

    objectTypes.forEach((t) => this.typesCache.set(t.id, t));
    fields.forEach((f) => this.fieldsCache.set(f.id, f));

    // Resolve all schemas and populate schema cache
    for (const objType of objectTypes) {
      const resolved = SchemaInheritanceFlattener.flatten(
        objType,
        this.typesCache,
        this.fieldsCache
      );
      this.schemaCache.set(objType.id, resolved);
    }
  }

  /**
   * Register or update an ObjectTypeDefinition in persistence and cache.
   */
  async registerObjectType(objectType: ObjectTypeDefinition): Promise<ResolvedObjectTypeSchema> {
    // 1. Cycle detection check
    SchemaInheritanceFlattener.detectCycle(
      objectType.id,
      objectType.parentTypeId,
      this.typesCache
    );

    // 2. Save to persistence
    await this.objectTypeRepo.save(objectType);
    this.typesCache.set(objectType.id, objectType);

    // 3. Invalidate cache and re-resolve
    this.invalidateCache();
    return this.resolveSchema(objectType.id);
  }

  /**
   * Register or update a FieldDefinition in persistence and cache.
   */
  async registerField(field: FieldDefinition): Promise<FieldDefinition> {
    await this.fieldRepo.save(field);
    this.fieldsCache.set(field.id, field);
    this.invalidateCache();
    return field;
  }

  /**
   * Resolves a fully flattened schema for a given Object Type ID.
   */
  resolveSchema(typeId: string): ResolvedObjectTypeSchema {
    const cached = this.schemaCache.get(typeId);
    if (cached) return cached;

    const targetType = this.typesCache.get(typeId);
    if (!targetType) {
      throw new Error(`ObjectType with ID '${typeId}' not found in Registry.`);
    }

    const resolved = SchemaInheritanceFlattener.flatten(
      targetType,
      this.typesCache,
      this.fieldsCache
    );
    this.schemaCache.set(typeId, resolved);
    return resolved;
  }

  /**
   * Retrieves an ObjectTypeDefinition by ID or Name.
   */
  getObjectType(typeIdOrName: string): ObjectTypeDefinition | null {
    if (this.typesCache.has(typeIdOrName)) {
      return this.typesCache.get(typeIdOrName) || null;
    }
    for (const typeDef of this.typesCache.values()) {
      if (typeDef.name.toLowerCase() === typeIdOrName.toLowerCase()) {
        return typeDef;
      }
    }
    return null;
  }

  /**
   * Lists all registered object types in memory.
   */
  listObjectTypes(): ObjectTypeDefinition[] {
    return Array.from(this.typesCache.values());
  }

  /**
   * Invalidate runtime cache when metadata changes.
   */
  invalidateCache(): void {
    this.schemaCache.clear();
    // Re-flatten all known types
    for (const objType of this.typesCache.values()) {
      try {
        const resolved = SchemaInheritanceFlattener.flatten(
          objType,
          this.typesCache,
          this.fieldsCache
        );
        this.schemaCache.set(objType.id, resolved);
      } catch (err) {
        // Log or handle orphan/broken inheritance nodes during invalidation
      }
    }
  }
}
