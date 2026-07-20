export interface AggregateSpec {
  field: string;
  type: "count" | "sum" | "avg" | "min" | "max";
  label?: string;
}

export interface GroupSpec {
  field: string;
  target: "property" | "metadata" | "relationship" | "objectType";
  sortDirection?: "asc" | "desc";
  aggregations?: AggregateSpec[];
}

export type GroupSpecification = GroupSpec[];
