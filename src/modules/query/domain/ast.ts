export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty"
  | "relative_date"
  | "date_range";

export interface PropertyPredicate {
  type: "property";
  fieldKey: string;
  operator: FilterOperator;
  value?: any;
}

export interface MetadataPredicate {
  type: "metadata";
  metadataKey: string;
  operator: FilterOperator;
  value?: any;
}

export interface RelationshipPredicate {
  type: "relationship";
  relationType: string;
  targetTypeId?: string;
  targetId?: string;
  operator: "has_relationship" | "count_eq" | "count_gt";
  value?: any;
}

export interface DatePredicate {
  type: "date";
  fieldKey: string;
  operator: "today" | "this_week" | "this_month" | "last_n_days" | "custom_range";
  value?: { start?: string; end?: string; days?: number };
}

export interface LogicalPredicate {
  type: "logical";
  operator: "AND" | "OR" | "NOT";
  expressions: CoreQueryPredicate[];
}

export type CoreQueryPredicate =
  | PropertyPredicate
  | MetadataPredicate
  | RelationshipPredicate
  | DatePredicate
  | LogicalPredicate;

export interface SortSpecification {
  field: string;
  direction: "asc" | "desc";
  nullsFirst?: boolean;
}

export interface PaginationSpecification {
  offset: number;
  limit: number;
  cursor?: string;
}

export interface CoreQueryAST {
  version: number;
  objectTypes?: string[];
  predicate?: CoreQueryPredicate;
  sort?: SortSpecification[];
  pagination?: PaginationSpecification;
}
