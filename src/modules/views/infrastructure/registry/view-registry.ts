import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { ViewOverride } from "../../domain/entities/view-override";
import { IViewRegistry, ILayoutAdapter } from "../../domain/ports/view-registry.port";
import { IViewRepository } from "../../domain/ports/view-repository.port";

export class ViewRegistry implements IViewRegistry {
  private adapters = new Map<LayoutType, ILayoutAdapter>();

  constructor(private viewRepository: IViewRepository) {}

  public registerAdapter(adapter: ILayoutAdapter): void {
    this.adapters.set(adapter.layoutType, adapter);
  }

  public getAdapter(layoutType: LayoutType): ILayoutAdapter {
    const adapter = this.adapters.get(layoutType);
    if (!adapter) {
      throw new Error(`No LayoutAdapter registered for layoutType: ${layoutType}`);
    }
    return adapter;
  }

  public async registerSystemViews(views: ViewDefinition[]): Promise<void> {
    for (const view of views) {
      await this.viewRepository.save({
        ...view,
        isSystem: true,
      });
    }
  }

  public async resolveEffectiveView(
    workspaceId: string,
    viewId: string,
    userId?: string
  ): Promise<ViewDefinition> {
    const baseView = await this.viewRepository.findById(viewId);
    if (!baseView) {
      throw new Error(`ViewDefinition not found for ID: ${viewId}`);
    }

    // 1. Check workspace-level override
    const wsOverride = await this.viewRepository.findOverride(workspaceId, viewId, undefined);

    // 2. Check user-level override if userId provided
    const userOverride = userId
      ? await this.viewRepository.findOverride(workspaceId, viewId, userId)
      : null;

    // Compose base + workspace delta + user delta
    return this.applyOverrides(baseView, wsOverride, userOverride);
  }

  public async listViewsForWorkspace(
    workspaceId: string,
    objectTypeId?: string
  ): Promise<ViewDefinition[]> {
    return this.viewRepository.findByWorkspace(workspaceId, objectTypeId);
  }

  private applyOverrides(
    base: ViewDefinition,
    wsOverride: ViewOverride | null,
    userOverride: ViewOverride | null
  ): ViewDefinition {
    let effective = { ...base };

    if (wsOverride?.delta) {
      effective = this.mergeDelta(effective, wsOverride.delta);
    }

    if (userOverride?.delta) {
      effective = this.mergeDelta(effective, userOverride.delta);
    }

    return effective;
  }

  private mergeDelta(
    base: ViewDefinition,
    delta: ViewOverride["delta"]
  ): ViewDefinition {
    return {
      ...base,
      name: delta.name ?? base.name,
      columns: delta.columns ?? base.columns,
      fieldVisibility: delta.fieldVisibility
        ? { ...base.fieldVisibility, ...delta.fieldVisibility }
        : base.fieldVisibility,
      queryAST: delta.queryAST
        ? { ...base.queryAST, ...delta.queryAST }
        : base.queryAST,
      savedState: delta.savedState
        ? { ...base.savedState, ...delta.savedState }
        : base.savedState,
      isPinned: delta.isPinned ?? base.isPinned,
      isFavorite: delta.isFavorite ?? base.isFavorite,
    };
  }
}
