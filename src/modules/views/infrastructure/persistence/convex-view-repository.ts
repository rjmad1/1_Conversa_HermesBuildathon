import { ViewDefinition } from "../../domain/entities/view-definition";
import { ViewOverride } from "../../domain/entities/view-override";
import { IViewRepository } from "../../domain/ports/view-repository.port";

export interface ConvexClientPort {
  query(functionName: string, args: any): Promise<any>;
  mutation(functionName: string, args: any): Promise<any>;
}

export class ConvexViewRepository implements IViewRepository {
  constructor(
    private convexClient: ConvexClientPort,
    private tenantId: string,
    private workspaceId: string
  ) {}

  public async findById(viewId: string): Promise<ViewDefinition | null> {
    const raw = await this.convexClient.query("views:getViewDefinition", {
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      viewId,
    });
    return raw ? this.mapToDefinition(raw) : null;
  }

  public async findByWorkspace(
    workspaceId: string,
    objectTypeId?: string
  ): Promise<ViewDefinition[]> {
    const rawList = await this.convexClient.query("views:listWorkspaceViews", {
      tenantId: this.tenantId,
      workspaceId,
      objectTypeId,
    });
    return (rawList || []).map((raw: any) => this.mapToDefinition(raw));
  }

  public async save(view: ViewDefinition): Promise<void> {
    await this.convexClient.mutation("views:saveViewDefinition", {
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      view,
    });
  }

  public async delete(viewId: string): Promise<void> {
    await this.convexClient.mutation("views:deleteViewDefinition", {
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      viewId,
    });
  }

  public async findOverride(
    workspaceId: string,
    parentViewId: string,
    userId?: string
  ): Promise<ViewOverride | null> {
    const raw = await this.convexClient.query("views:getViewOverride", {
      tenantId: this.tenantId,
      workspaceId,
      parentViewId,
      userId,
    });
    return raw ? this.mapToOverride(raw) : null;
  }

  public async saveOverride(override: ViewOverride): Promise<void> {
    await this.convexClient.mutation("views:saveViewOverride", {
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      override,
    });
  }

  public async deleteOverride(overrideId: string): Promise<void> {
    await this.convexClient.mutation("views:deleteViewOverride", {
      tenantId: this.tenantId,
      workspaceId: this.workspaceId,
      overrideId,
    });
  }

  private mapToDefinition(raw: any): ViewDefinition {
    return {
      id: raw.id,
      tenantId: raw.tenantId,
      workspaceId: raw.workspaceId,
      name: raw.name,
      description: raw.description,
      objectTypes: raw.objectTypes || (raw.objectTypeId ? [raw.objectTypeId] : []),
      layoutType: raw.layoutType || raw.type || "list",
      queryAST: raw.queryAST || { version: 1 },
      columns: raw.columns || [],
      fieldVisibility: raw.fieldVisibility || {},
      defaultActions: raw.defaultActions || [],
      permissions: raw.permissions || { isPublic: true },
      savedState: raw.savedState,
      isSystem: !!raw.isSystem,
      isPinned: !!raw.isPinned,
      isFavorite: !!raw.isFavorite,
      parentViewId: raw.parentViewId,
      version: raw.version || 1,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private mapToOverride(raw: any): ViewOverride {
    return {
      id: raw.id,
      tenantId: raw.tenantId,
      workspaceId: raw.workspaceId,
      userId: raw.userId,
      parentViewId: raw.parentViewId,
      overrideType: raw.overrideType || "workspace",
      delta: raw.delta || {},
      version: raw.version || 1,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
