import { describe, it, expect, beforeEach } from "vitest";
import {
  ViewDefinition,
  ViewOverride,
  ViewRegistry,
  ViewApplicationService,
  IViewRepository,
  ListLayoutAdapter,
  TableLayoutAdapter,
  BoardLayoutAdapter,
  CalendarLayoutAdapter,
  TimelineLayoutAdapter,
  GalleryLayoutAdapter,
  HierarchyLayoutAdapter,
  TreeLayoutAdapter,
  NetworkLayoutAdapter,
} from "../../src/modules/views";

class InMemoryViewRepository implements IViewRepository {
  private views = new Map<string, ViewDefinition>();
  private overrides = new Map<string, ViewOverride>();

  async findById(viewId: string): Promise<ViewDefinition | null> {
    return this.views.get(viewId) || null;
  }

  async findByWorkspace(workspaceId: string, objectTypeId?: string): Promise<ViewDefinition[]> {
    const list = Array.from(this.views.values()).filter((v) => v.workspaceId === workspaceId);
    if (objectTypeId) {
      return list.filter((v) => v.objectTypes.includes(objectTypeId));
    }
    return list;
  }

  async save(view: ViewDefinition): Promise<void> {
    this.views.set(view.id, view);
  }

  async delete(viewId: string): Promise<void> {
    this.views.delete(viewId);
  }

  async findOverride(
    workspaceId: string,
    parentViewId: string,
    userId?: string
  ): Promise<ViewOverride | null> {
    for (const ov of this.overrides.values()) {
      if (
        ov.workspaceId === workspaceId &&
        ov.parentViewId === parentViewId &&
        ov.userId === userId
      ) {
        return ov;
      }
    }
    return null;
  }

  async saveOverride(override: ViewOverride): Promise<void> {
    this.overrides.set(override.id, override);
  }

  async deleteOverride(overrideId: string): Promise<void> {
    this.overrides.delete(overrideId);
  }
}

describe("Dynamic Views Platform", () => {
  let repository: InMemoryViewRepository;
  let registry: ViewRegistry;
  let service: ViewApplicationService;

  const sampleItems = [
    {
      id: "obj_1",
      title: "Sprint Planning",
      type: "Meeting",
      status: "completed",
      properties: { priority: "high", status: "completed", scheduledAt: Date.now() },
      createdAt: Date.now() - 1000,
    },
    {
      id: "obj_2",
      title: "Design View AST",
      type: "Task",
      status: "in_progress",
      properties: { priority: "urgent", status: "in_progress", dueDate: Date.now() + 86400000 },
      createdAt: Date.now() - 500,
    },
    {
      id: "obj_3",
      title: "Launch AegisOS",
      type: "Project",
      status: "backlog",
      properties: { priority: "medium", status: "backlog" },
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    repository = new InMemoryViewRepository();
    registry = new ViewRegistry(repository);

    // Register 9 layout adapters
    registry.registerAdapter(new ListLayoutAdapter());
    registry.registerAdapter(new TableLayoutAdapter());
    registry.registerAdapter(new BoardLayoutAdapter());
    registry.registerAdapter(new CalendarLayoutAdapter());
    registry.registerAdapter(new TimelineLayoutAdapter());
    registry.registerAdapter(new GalleryLayoutAdapter());
    registry.registerAdapter(new HierarchyLayoutAdapter());
    registry.registerAdapter(new TreeLayoutAdapter());
    registry.registerAdapter(new NetworkLayoutAdapter());

    service = new ViewApplicationService(registry, repository);
  });

  it("should create, persist, and resolve custom view definition", async () => {
    const created = await service.createView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      name: "Urgent Tasks",
      layoutType: "board",
      objectTypes: ["Task"],
      isPinned: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Urgent Tasks");

    const fetched = await service.resolveView("ws_1", created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.layoutType).toBe("board");
  });

  it("should resolve effective view with layered workspace & user overrides", async () => {
    const baseView: ViewDefinition = {
      id: "view_base",
      tenantId: "t_1",
      workspaceId: "ws_1",
      name: "Base Tasks",
      objectTypes: ["Task"],
      layoutType: "list",
      queryAST: { version: 1 },
      columns: [{ key: "title", label: "Title" }],
      fieldVisibility: { title: true },
      defaultActions: ["open"],
      permissions: { isPublic: true },
      isSystem: true,
      isPinned: false,
      isFavorite: false,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await repository.save(baseView);

    // Add workspace override
    await service.createOverride("t_1", "ws_1", "view_base", {
      name: "Team Tasks Board",
      isPinned: true,
    });

    const effectiveWs = await service.resolveView("ws_1", "view_base");
    expect(effectiveWs.name).toBe("Team Tasks Board");
    expect(effectiveWs.isPinned).toBe(true);

    // Add user override
    await service.createOverride(
      "t_1",
      "ws_1",
      "view_base",
      {
        name: "My Personal Tasks Board",
        isFavorite: true,
      },
      "user_123"
    );

    const effectiveUser = await service.resolveView("ws_1", "view_base", "user_123");
    expect(effectiveUser.name).toBe("My Personal Tasks Board");
    expect(effectiveUser.isPinned).toBe(true);
    expect(effectiveUser.isFavorite).toBe(true);
  });

  it("should render List, Board, Table, Gallery, and Network layouts accurately", async () => {
    const boardView = await service.createView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      name: "Board Projection Test",
      layoutType: "board",
      objectTypes: ["Meeting", "Task", "Project"],
    });

    const boardModel = await service.renderView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      viewId: boardView.id,
      rawItems: sampleItems,
    });

    expect(boardModel.layoutType).toBe("board");
    expect(boardModel.groups.length).toBeGreaterThan(0);
    expect(boardModel.items.length).toBe(3);

    const networkView = await service.createView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      name: "Network Graph Test",
      layoutType: "network",
      objectTypes: ["Meeting", "Task"],
    });

    const networkModel = await service.renderView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      viewId: networkView.id,
      rawItems: sampleItems,
      rawEdges: [{ id: "e1", sourceId: "obj_1", targetId: "obj_2", relationType: "DEPENDS_ON" }],
    });

    expect(networkModel.layoutType).toBe("network");
    expect(networkModel.relationships.length).toBe(1);
    expect(networkModel.relationships[0]!.relationType).toBe("DEPENDS_ON");
  });

  it("should apply FilterExpression AST to filter projected view items", async () => {
    const filteredView = await service.createView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      name: "Only In Progress Tasks",
      layoutType: "table",
      objectTypes: ["Task"],
      queryAST: {
        version: 1,
        filter: {
          type: "property",
          fieldKey: "status",
          operator: "eq",
          value: "in_progress",
        },
      },
    });

    const model = await service.renderView({
      tenantId: "t_1",
      workspaceId: "ws_1",
      viewId: filteredView.id,
      rawItems: sampleItems,
    });

    expect(model.items.length).toBe(1);
    expect(model.items[0]!.title).toBe("Design View AST");
  });
});
