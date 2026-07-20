export interface WorkspaceSelection {
  focusedObjectId?: string;
  focusedObjectType?: string;
  selectedObjectIds: string[];
  activeViewId?: string;
  contextMetadata?: Record<string, unknown>;
  timestamp: number;
}
