import { describe, it, expect, beforeEach } from "vitest";
import { WorkspaceOSFacade } from "../../src/modules/workspace/application/services/workspace-os-facade";
import { WORKSPACE_EVENT_TYPES } from "../../src/modules/workspace/domain/events/workspace-events";

describe("Workspace Operating System", () => {
  let workspaceOS: WorkspaceOSFacade;

  beforeEach(async () => {
    workspaceOS = new WorkspaceOSFacade();
    await workspaceOS.initialize("tenant_test", "ws_test", "user_test");
  });

  it("should initialize a workspace session with default profiles and layouts", async () => {
    const session = await workspaceOS.resolveWorkspace("ws_test");
    expect(session).not.toBeNull();
    expect(session?.tenantId).toBe("tenant_test");
    expect(session?.workspaceId).toBe("ws_test");
    expect(session?.activeProfileId).toBe("profile_default");
    expect(session?.mode).toBe("Standard");
  });

  it("should resolve dynamic navigation nodes from registered providers", async () => {
    const navNodes = await workspaceOS.resolveNavigation("profile_default");
    expect(navNodes.length).toBeGreaterThan(0);
    expect(navNodes.some((n) => n.label === "Inbox")).toBe(true);
    expect(navNodes.some((n) => n.label === "Saved Views")).toBe(true);
    expect(navNodes.some((n) => n.label === "Saved Searches")).toBe(true);
  });

  it("should resolve intents and execute commands through CommandBus", async () => {
    const availableCmds = await workspaceOS.commandBus.getIntentResolver().resolve("inbox", {});
    expect(availableCmds.length).toBeGreaterThan(0);
    expect(availableCmds[0]!.id).toBe("cmd_open_inbox");

    const result = await workspaceOS.executeCommand("cmd_open_inbox");
    expect(result.success).toBe(true);
  });

  it("should handle OpenObject and update SelectionBus & Tabs", async () => {
    let selectedId: string | undefined;
    workspaceOS.subscribeSelection((sel) => {
      selectedId = sel.focusedObjectId;
    });

    await workspaceOS.openObject("obj_12345", { targetObjectType: "Meeting" });

    expect(selectedId).toBe("obj_12345");
    const layout = await workspaceOS.resolveLayout("profile_default");
    expect(layout.openTabs.some((t) => t.id === "tab_obj_obj_12345")).toBe(true);
  });

  it("should handle OpenView and trigger Navigation transitions", async () => {
    let transitionedTo: string | undefined;
    workspaceOS.eventBus.subscribe(WORKSPACE_EVENT_TYPES.NAVIGATION_TRANSITION, (evt: any) => {
      transitionedTo = evt.payload.toUri;
    });

    await workspaceOS.openView("view_kanban_1");

    expect(transitionedTo).toBe("workspace://views/view_kanban_1");
  });

  it("should stream contextual metadata through Universal Inspector for active selection", async () => {
    await workspaceOS.openObject("obj_9999", { targetObjectType: "Project" });

    const inspectorContent = await workspaceOS.inspectorEngine.getInspectorContentForCurrentSelection();
    expect(inspectorContent.selection.focusedObjectId).toBe("obj_9999");
    expect(inspectorContent.sections.length).toBeGreaterThan(0);
    expect(inspectorContent.sections.some((s) => s.title.includes("Metadata"))).toBe(true);
  });

  it("should update layout split ratio and toggle inspector collapse state", async () => {
    const initialLayout = await workspaceOS.resolveLayout("profile_default");
    expect(initialLayout.isInspectorCollapsed).toBe(false);

    workspaceOS.layoutEngine.toggleInspector();
    const updatedLayout = await workspaceOS.resolveLayout("profile_default");
    expect(updatedLayout.isInspectorCollapsed).toBe(true);

    workspaceOS.layoutEngine.updateMainSplitRatio(0.75);
    expect(workspaceOS.layoutEngine.getLayout().mainSplitRatio).toBe(0.75);
  });

  it("should switch workspace mode in session engine", async () => {
    await workspaceOS.sessionEngine.setWorkspaceMode("Focus");
    const session = await workspaceOS.resolveWorkspace("ws_test");
    expect(session?.mode).toBe("Focus");
  });
});
