import type {
  ObjectTypeDefinition,
  FieldDefinition,
  ResolvedObjectTypeSchema,
  ObjectTemplate,
  ValidationResult,
} from "../domain/types";
import type {
  IObjectTypeRepository,
  IFieldDefinitionRepository,
  ITemplateRepository,
} from "../domain/ports";
import { RegistryService } from "../domain/registry";
import { ValidationEngine } from "../services/validation-engine";

export interface CreateObjectTypeInput {
  tenantId: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  parentTypeId?: string;
  fieldDefinitions?: string[];
  defaultViewId?: string;
  supportedViewIds?: string[];
  defaultActionIds?: string[];
  systemType?: boolean;
  isExtensible?: boolean;
}

export interface RegisterFieldInput {
  tenantId: string;
  workspaceId: string;
  key: string;
  name: string;
  type: FieldDefinition["type"];
  required?: boolean;
  defaultValue?: any;
  constraints?: FieldDefinition["constraints"];
  description?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  aiVisible?: boolean;
}

export interface RegisterTemplateInput {
  tenantId: string;
  workspaceId: string;
  objectTypeId: string;
  name: string;
  description?: string;
  defaultProperties?: Record<string, any>;
  defaultLabels?: string[];
  defaultRelationships?: Array<{ targetId: string; relationType: string }>;
  defaultActions?: string[];
}

export class MetadataAppService {
  private validationEngine = new ValidationEngine();
  private registryService: RegistryService;

  constructor(
    private objectTypeRepo: IObjectTypeRepository,
    private fieldRepo: IFieldDefinitionRepository,
    private templateRepo?: ITemplateRepository
  ) {
    this.registryService = new RegistryService(objectTypeRepo, fieldRepo, templateRepo);
  }

  async initializeWorkspace(tenantId: string, workspaceId: string): Promise<void> {
    await this.registryService.initializeWorkspace(tenantId, workspaceId);
  }

  // --- Object Type APIs ---
  async createObjectType(input: CreateObjectTypeInput): Promise<ResolvedObjectTypeSchema> {
    const now = Date.now();
    const id = `type_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const typeDef: ObjectTypeDefinition = {
      id,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      description: input.description,
      parentTypeId: input.parentTypeId,
      fieldDefinitions: input.fieldDefinitions || [],
      defaultViewId: input.defaultViewId,
      supportedViewIds: input.supportedViewIds || ["list", "table"],
      defaultActionIds: input.defaultActionIds || [],
      validationRules: [],
      systemType: input.systemType || false,
      isExtensible: input.isExtensible ?? true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    return await this.registryService.registerObjectType(typeDef);
  }

  async getObjectType(id: string): Promise<ObjectTypeDefinition | null> {
    return this.registryService.getObjectType(id);
  }

  async resolveSchema(typeId: string): Promise<ResolvedObjectTypeSchema> {
    return this.registryService.resolveSchema(typeId);
  }

  async listObjectTypes(tenantId: string, workspaceId: string): Promise<ObjectTypeDefinition[]> {
    const inMemory = this.registryService.listObjectTypes();
    if (inMemory.length > 0) return inMemory;
    return await this.objectTypeRepo.listByWorkspace(tenantId, workspaceId);
  }

  // --- Field Registration APIs ---
  async registerField(input: RegisterFieldInput): Promise<FieldDefinition> {
    const now = Date.now();
    const id = `field_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const fieldDef: FieldDefinition = {
      id,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      key: input.key,
      name: input.name,
      type: input.type,
      required: input.required || false,
      defaultValue: input.defaultValue,
      constraints: input.constraints,
      validation: [],
      description: input.description,
      searchable: input.searchable ?? true,
      filterable: input.filterable ?? true,
      sortable: input.sortable ?? true,
      aiVisible: input.aiVisible ?? true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    return await this.registryService.registerField(fieldDef);
  }

  // --- Validation API ---
  async validateObject(typeId: string, properties: Record<string, any>): Promise<ValidationResult> {
    const schema = await this.resolveSchema(typeId);
    return await this.validationEngine.validate(schema, properties);
  }

  // --- Template APIs ---
  async registerTemplate(input: RegisterTemplateInput): Promise<ObjectTemplate> {
    if (!this.templateRepo) {
      throw new Error("Template repository not configured");
    }
    const now = Date.now();
    const id = `tmpl_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const template: ObjectTemplate = {
      id,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      objectTypeId: input.objectTypeId,
      name: input.name,
      description: input.description,
      defaultProperties: input.defaultProperties || {},
      defaultLabels: input.defaultLabels || [],
      defaultRelationships: input.defaultRelationships || [],
      defaultActions: input.defaultActions || [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.templateRepo.save(template);
    return template;
  }
}
