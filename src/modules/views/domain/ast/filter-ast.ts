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

export interface PropertyFilter {
  type: "property";
  fieldKey: string;
  operator: FilterOperator;
  value?: any;
}

export interface RelationshipFilter {
  type: "relationship";
  relationType: string;
  targetTypeId?: string;
  targetId?: string;
  operator: "has_relationship" | "count_eq" | "count_gt";
  value?: any;
}

export interface MetadataFilter {
  type: "metadata";
  metadataKey: string;
  operator: FilterOperator;
  value?: any;
}

export interface DateFilter {
  type: "date";
  fieldKey: string;
  operator: "today" | "this_week" | "this_month" | "last_n_days" | "custom_range";
  value?: { start?: string; end?: string; days?: number };
}

export interface ComputedFilter {
  type: "computed";
  expressionKey: string;
  operator: FilterOperator;
  value?: any;
}

export interface LogicalFilter {
  type: "logical";
  operator: "AND" | "OR" | "NOT";
  expressions: FilterExpression[];
}

export type FilterExpression =
  | PropertyFilter
  | RelationshipFilter
  | MetadataFilter
  | DateFilter
  | ComputedFilter
  | LogicalFilter;
