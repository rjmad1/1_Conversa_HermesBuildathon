import type {
  ObjectTypeDefinition,
  FieldDefinition,
  ObjectTemplate,
  ValidationRuleDefinition,
  ViewDefinition,
  ActionDefinition,
  RelationshipTypeDefinition,
} from "./types";

export interface IObjectTypeRepository {
  save(objectType: ObjectTypeDefinition): Promise<void>;
  findById(id: string): Promise<ObjectTypeDefinition | null>;
  findByName(tenantId: string, workspaceId: string, name: string): Promise<ObjectTypeDefinition | null>;
  listByWorkspace(tenantId: string, workspaceId: string): Promise<ObjectTypeDefinition[]>;
  delete(id: string): Promise<void>;
}

export interface IFieldDefinitionRepository {
  save(field: FieldDefinition): Promise<void>;
  findById(id: string): Promise<FieldDefinition | null>;
  findByKey(tenantId: string, workspaceId: string, key: string): Promise<FieldDefinition | null>;
  listByIds(ids: string[]): Promise<FieldDefinition[]>;
  listByWorkspace(tenantId: string, workspaceId: string): Promise<FieldDefinition[]>;
  delete(id: string): Promise<void>;
}

export interface ITemplateRepository {
  save(template: ObjectTemplate): Promise<void>;
  findById(id: string): Promise<ObjectTemplate | null>;
  listByObjectType(tenantId: string, workspaceId: string, objectTypeId: string): Promise<ObjectTemplate[]>;
  listByWorkspace(tenantId: string, workspaceId: string): Promise<ObjectTemplate[]>;
  delete(id: string): Promise<void>;
}

export interface IValidationRuleRepository {
  save(rule: ValidationRuleDefinition): Promise<void>;
  findById(id: string): Promise<ValidationRuleDefinition | null>;
  listByIds(ids: string[]): Promise<ValidationRuleDefinition[]>;
  listByWorkspace(tenantId: string, workspaceId: string): Promise<ValidationRuleDefinition[]>;
}

export interface IViewDefinitionRepository {
  save(view: ViewDefinition): Promise<void>;
  findById(id: string): Promise<ViewDefinition | null>;
  listByObjectType(tenantId: string, workspaceId: string, objectTypeId: string): Promise<ViewDefinition[]>;
}

export interface IActionDefinitionRepository {
  save(action: ActionDefinition): Promise<void>;
  findById(id: string): Promise<ActionDefinition | null>;
  listByIds(ids: string[]): Promise<ActionDefinition[]>;
}

export interface IRelationshipTypeRepository {
  save(relType: RelationshipTypeDefinition): Promise<void>;
  findByCode(tenantId: string, workspaceId: string, code: string): Promise<RelationshipTypeDefinition | null>;
  listByWorkspace(tenantId: string, workspaceId: string): Promise<RelationshipTypeDefinition[]>;
}
