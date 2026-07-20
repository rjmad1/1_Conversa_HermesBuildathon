import { ViewDefinition, LayoutType } from "../../domain/entities/view-definition";
import { ViewOverride } from "../../domain/entities/view-override";
import { CanonicalViewModel } from "../../domain/entities/canonical-view-model";
import { IViewRegistry } from "../../domain/ports/view-registry.port";
import { IViewRepository } from "../../domain/ports/view-repository.port";
import { ProjectionPlanner } from "../engine/projection-planner";
import { ProjectionPipeline } from "../engine/projection-pipeline";
import { ViewProjectionCache } from "../../infrastructure/cache/view-projection-cache";

export interface CreateViewCommand {
  tenantId: string;
  workspaceId: string;
  name: string;
  description?: string;
  objectTypes: string[];
  layoutType: LayoutType;
  queryAST?: any;
  columns?: any[];
  fieldVisibility?: Record<string, boolean>;
  defaultActions?: string[];
  permissions?: any;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface UpdateViewCommand {
  viewId: string;
  workspaceId: string;
  name?: string;
  description?: string;
  objectTypes?: string[];
  layoutType?: LayoutType;
  queryAST?: any;
  columns?: any[];
  fieldVisibility?: Record<string, boolean>;
  defaultActions?: string[];
  permissions?: any;
  savedState?: Record<string, any>;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface ViewExecutionRequest {
  tenantId: string;
  workspaceId: string;
  viewId: string;
  userId?: string;
  rawItems: any[];
  rawEdges?: any[];
  pageSize?: number;
  mode?: "interactive" | "analytical" | "export";
}

export class ViewApplicationService {
  private planner = new ProjectionPlanner();
  private pipeline: ProjectionPipeline;
  private cache = new ViewProjectionCache();

  constructor(
    private registry: IViewRegistry,
    private viewRepository: IViewRepository
  ) {
    this.pipeline = new ProjectionPipeline(registry);
  }

  public async createView(cmd: CreateViewCommand): Promise<ViewDefinition> {
    const id = `view_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const view: ViewDefinition = {
      id,
      tenantId: cmd.tenantId,
      workspaceId: cmd.workspaceId,
      name: cmd.name,
      description: cmd.description,
      objectTypes: cmd.objectTypes,
      layoutType: cmd.layoutType,
      queryAST: cmd.queryAST || { version: 1 },
      columns: cmd.columns || [],
      fieldVisibility: cmd.fieldVisibility || {},
      defaultActions: cmd.defaultActions || [],
      permissions: cmd.permissions || { isPublic: true },
      isSystem: false,
      isPinned: !!cmd.isPinned,
      isFavorite: !!cmd.isFavorite,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await this.viewRepository.save(view);
    this.cache.invalidate(`ws_${cmd.workspaceId}`);
    return view;
  }

  public async updateView(cmd: UpdateViewCommand): Promise<ViewDefinition> {
    const existing = await this.viewRepository.findById(cmd.viewId);
    if (!existing) {
      throw new Error(`View defined by ID ${cmd.viewId} not found.`);
    }

    const updated: ViewDefinition = {
      ...existing,
      name: cmd.name ?? existing.name,
      description: cmd.description ?? existing.description,
      objectTypes: cmd.objectTypes ?? existing.objectTypes,
      layoutType: cmd.layoutType ?? existing.layoutType,
      queryAST: cmd.queryAST ? { ...existing.queryAST, ...cmd.queryAST } : existing.queryAST,
      columns: cmd.columns ?? existing.columns,
      fieldVisibility: cmd.fieldVisibility
        ? { ...existing.fieldVisibility, ...cmd.fieldVisibility }
        : existing.fieldVisibility,
      defaultActions: cmd.defaultActions ?? existing.defaultActions,
      permissions: cmd.permissions ?? existing.permissions,
      savedState: cmd.savedState ? { ...existing.savedState, ...cmd.savedState } : existing.savedState,
      isPinned: cmd.isPinned ?? existing.isPinned,
      isFavorite: cmd.isFavorite ?? existing.isFavorite,
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    await this.viewRepository.save(updated);
    this.cache.invalidate(`ws_${cmd.workspaceId}`);
    return updated;
  }

  public async deleteView(viewId: string, workspaceId: string): Promise<void> {
    await this.viewRepository.delete(viewId);
    this.cache.invalidate(`ws_${workspaceId}`);
  }

  public async resolveView(
    workspaceId: string,
    viewId: string,
    userId?: string
  ): Promise<ViewDefinition> {
    return this.registry.resolveEffectiveView(workspaceId, viewId, userId);
  }

  public async renderView(request: ViewExecutionRequest): Promise<CanonicalViewModel> {
    const cacheKey = `ws_${request.workspaceId}_v_${request.viewId}_u_${request.userId || "anon"}`;
    const queryHash = JSON.stringify({ itemCount: request.rawItems.length, mode: request.mode });

    const cached = this.cache.get(cacheKey, queryHash);
    if (cached) {
      return cached;
    }

    const effectiveView = await this.resolveView(request.workspaceId, request.viewId, request.userId);
    const plan = this.planner.createPlan(effectiveView, {
      mode: request.mode,
      pageSize: request.pageSize,
    });

    const viewModel = this.pipeline.execute(
      plan,
      effectiveView,
      request.rawItems,
      request.rawEdges || []
    );

    this.cache.set(cacheKey, queryHash, viewModel);
    return viewModel;
  }

  public async previewView(
    definition: Partial<ViewDefinition>,
    rawItems: any[],
    rawEdges: any[] = []
  ): Promise<CanonicalViewModel> {
    const dummyDef: ViewDefinition = {
      id: "preview_temp",
      tenantId: "temp",
      workspaceId: "temp",
      name: definition.name || "Preview View",
      objectTypes: definition.objectTypes || [],
      layoutType: definition.layoutType || "list",
      queryAST: definition.queryAST || { version: 1 },
      columns: definition.columns || [],
      fieldVisibility: definition.fieldVisibility || {},
      defaultActions: definition.defaultActions || [],
      permissions: { isPublic: true },
      isSystem: false,
      isPinned: false,
      isFavorite: false,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const plan = this.planner.createPlan(dummyDef, { mode: "interactive" });
    return this.pipeline.execute(plan, dummyDef, rawItems, rawEdges);
  }

  public async createOverride(
    tenantId: string,
    workspaceId: string,
    parentViewId: string,
    delta: ViewOverride["delta"],
    userId?: string
  ): Promise<ViewOverride> {
    const overrideId = `ov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const override: ViewOverride = {
      id: overrideId,
      tenantId,
      workspaceId,
      userId,
      parentViewId,
      overrideType: userId ? "user" : "workspace",
      delta,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.viewRepository.saveOverride(override);
    this.cache.invalidate(`ws_${workspaceId}`);
    return override;
  }

  public async resetOverride(
    workspaceId: string,
    parentViewId: string,
    userId?: string
  ): Promise<void> {
    const existing = await this.viewRepository.findOverride(workspaceId, parentViewId, userId);
    if (existing) {
      await this.viewRepository.deleteOverride(existing.id);
      this.cache.invalidate(`ws_${workspaceId}`);
    }
  }
}
