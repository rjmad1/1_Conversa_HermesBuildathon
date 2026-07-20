import { ViewDefinition } from "../entities/view-definition";
import { ViewOverride } from "../entities/view-override";

export interface IViewRepository {
  findById(viewId: string): Promise<ViewDefinition | null>;
  findByWorkspace(workspaceId: string, objectTypeId?: string): Promise<ViewDefinition[]>;
  save(view: ViewDefinition): Promise<void>;
  delete(viewId: string): Promise<void>;
  findOverride(
    workspaceId: string,
    parentViewId: string,
    userId?: string
  ): Promise<ViewOverride | null>;
  saveOverride(override: ViewOverride): Promise<void>;
  deleteOverride(overrideId: string): Promise<void>;
}
