import { FilterExpression } from "./filter-ast";
import { SortSpecification } from "./sort-ast";
import { GroupSpecification } from "./group-ast";

export interface ColumnSpec {
  key: string;
  label: string;
  width?: number;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  order?: number;
}

export interface PaginationSpecification {
  offset?: number;
  limit?: number;
  cursor?: string;
}

export interface ProjectionSpecification {
  includeRelationships?: boolean;
  relationshipTypes?: string[];
  maxTraversalDepth?: number;
  includeMetadata?: boolean;
  computedFields?: string[];
}

export interface ViewQueryAST {
  version: number;
  filter?: FilterExpression;
  sort?: SortSpecification;
  group?: GroupSpecification;
  projection?: ProjectionSpecification;
  pagination?: PaginationSpecification;
}
