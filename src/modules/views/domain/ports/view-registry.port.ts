import { ViewDefinition, LayoutType } from "../entities/view-definition";
import { CanonicalViewModel } from "../entities/canonical-view-model";

export interface ILayoutAdapter {
  layoutType: LayoutType;
  project(
    items: any[],
    edges: any[],
    definition: ViewDefinition,
    options?: Record<string, any>
  ): CanonicalViewModel;
}

export interface IViewRegistry {
  registerSystemViews(views: ViewDefinition[]): Promise<void>;
  registerAdapter(adapter: ILayoutAdapter): void;
  getAdapter(layoutType: LayoutType): ILayoutAdapter;
  resolveEffectiveView(
    workspaceId: string,
    viewId: string,
    userId?: string
  ): Promise<ViewDefinition>;
  listViewsForWorkspace(
    workspaceId: string,
    objectTypeId?: string
  ): Promise<ViewDefinition[]>;
}
