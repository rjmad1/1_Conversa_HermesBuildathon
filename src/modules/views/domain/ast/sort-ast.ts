export interface SortSpec {
  field: string;
  direction: "asc" | "desc";
  target: "property" | "metadata" | "relationship" | "computed";
  nullsFirst?: boolean;
}

export type SortSpecification = SortSpec[];
