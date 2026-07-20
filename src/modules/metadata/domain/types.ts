export type FieldDataType =
  | "Text"
  | "Number"
  | "Boolean"
  | "Date"
  | "DateTime"
  | "URL"
  | "Email"
  | "Phone"
  | "Currency"
  | "Select"
  | "MultiSelect"
  | "Tag"
  | "Reference"
  | "RichText"
  | "JSON"
  | "AIGenerated"
  | "Computed"
  | "Rollup"
  | "Formula";

export interface FieldConstraints {
  min?: number;
  max?: number;
  regex?: string;
  options?: string[];
  allowedTargetTypes?: string[]; // For Reference type fields
  relationshipTypeCode?: string;
}

export interface FieldDisplayOptions {
  format?: string;
  icon?: string;
  placeholder?: string;
  order?: number;
}

export interface ValidationRuleReference {
  ruleId: string;
  params?: Record<string, any>;
}

export interface FieldDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  key: string;
  name: string;
  type: FieldDataType;
  required: boolean;
  defaultValue?: any;
  constraints?: FieldConstraints;
  validation?: ValidationRuleReference[];
  description?: string;
  displayOptions?: FieldDisplayOptions;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  aiVisible: boolean;
  editable: boolean;
  hidden: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ObjectTypeDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  parentTypeId?: string;
  fieldDefinitions: string[]; // FieldDefinition IDs
  defaultViewId?: string;
  supportedViewIds: string[];
  defaultActionIds: string[];
  validationRules: ValidationRuleReference[];
  systemType: boolean;
  isExtensible: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ResolvedObjectTypeSchema {
  typeId: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  parentTypeId?: string;
  inheritanceChain: string[]; // Root to Child type IDs
  fields: Map<string, FieldDefinition>; // key -> FieldDefinition (merged)
  validations: ValidationRuleReference[];
  defaultViewId?: string;
  supportedViewIds: string[];
  defaultActionIds: string[];
  systemType: boolean;
  isExtensible: boolean;
  effectiveVersion: number;
}

export interface ObjectTemplate {
  id: string;
  tenantId: string;
  workspaceId: string;
  objectTypeId: string;
  name: string;
  description?: string;
  defaultProperties: Record<string, any>;
  defaultLabels: string[];
  defaultRelationships: Array<{
    targetId: string;
    relationType: string;
  }>;
  defaultActions: string[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ValidationRuleDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  ruleType: string;
  params: Record<string, any>;
  errorMessage: string;
  severity: "error" | "warning" | "info";
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ViewDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  objectTypeId: string;
  name: string;
  type: "list" | "table" | "board" | "graph" | "calendar";
  config: Record<string, any>;
  isDefault: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ActionDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  actionType: string;
  config: Record<string, any>;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface RelationshipTypeDefinition {
  id: string;
  tenantId: string;
  workspaceId: string;
  code: string;
  name: string;
  inverseCode?: string;
  description?: string;
  allowedSourceTypes: string[];
  allowedTargetTypes: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ValidationError {
  fieldKey?: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
