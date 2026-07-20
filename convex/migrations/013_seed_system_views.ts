import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const SYSTEM_VIEW_DEFINITIONS = [
  {
    id: "sys_view_inbox",
    name: "Inbox",
    description: "Unprocessed and recent incoming knowledge objects",
    objectTypes: ["Meeting", "Transcript", "AudioAsset", "Task", "Document"],
    layoutType: "list",
    queryAST: {
      version: 1,
      filter: {
        type: "logical",
        operator: "AND",
        expressions: [
          { type: "property", fieldKey: "status", operator: "neq", value: "archived" },
        ],
      },
      sort: [{ field: "createdAt", direction: "desc", target: "property" }],
      pagination: { limit: 50 },
    },
    columns: [
      { key: "title", label: "Title", visible: true, order: 1 },
      { key: "type", label: "Type", visible: true, order: 2 },
      { key: "status", label: "Status", visible: true, order: 3 },
      { key: "createdAt", label: "Created At", visible: true, order: 4 },
    ],
    fieldVisibility: { title: true, type: true, status: true, createdAt: true },
    defaultActions: ["open", "archive"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: true,
    version: 1,
  },
  {
    id: "sys_view_meetings",
    name: "Meetings",
    description: "Overview of all recorded and scheduled meetings",
    objectTypes: ["Meeting"],
    layoutType: "table",
    queryAST: {
      version: 1,
      sort: [{ field: "scheduledAt", direction: "desc", target: "property" }],
      group: [{ field: "meetingType", target: "property", sortDirection: "asc" }],
      pagination: { limit: 100 },
    },
    columns: [
      { key: "title", label: "Meeting Title", visible: true, order: 1 },
      { key: "meetingType", label: "Type", visible: true, order: 2 },
      { key: "status", label: "Status", visible: true, order: 3 },
      { key: "scheduledAt", label: "Scheduled At", visible: true, order: 4 },
    ],
    fieldVisibility: { title: true, meetingType: true, status: true, scheduledAt: true },
    defaultActions: ["open", "transcribe"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_tasks",
    name: "Tasks",
    description: "Kanban board of action items and deliverables",
    objectTypes: ["Task"],
    layoutType: "board",
    queryAST: {
      version: 1,
      group: [{ field: "status", target: "property", sortDirection: "asc" }],
      sort: [{ field: "priority", direction: "desc", target: "property" }],
      pagination: { limit: 200 },
    },
    columns: [
      { key: "title", label: "Task Title", visible: true, order: 1 },
      { key: "status", label: "Status", visible: true, order: 2 },
      { key: "priority", label: "Priority", visible: true, order: 3 },
      { key: "dueDate", label: "Due Date", visible: true, order: 4 },
    ],
    fieldVisibility: { title: true, status: true, priority: true, dueDate: true },
    defaultActions: ["open", "complete", "assign"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: true,
    version: 1,
  },
  {
    id: "sys_view_projects",
    name: "Projects",
    description: "Gallery overview of workspace projects and initiatives",
    objectTypes: ["Project"],
    layoutType: "gallery",
    queryAST: {
      version: 1,
      group: [{ field: "status", target: "property", sortDirection: "asc" }],
      sort: [{ field: "updatedAt", direction: "desc", target: "property" }],
      pagination: { limit: 50 },
    },
    columns: [
      { key: "title", label: "Project Name", visible: true, order: 1 },
      { key: "status", label: "Status", visible: true, order: 2 },
      { key: "owner", label: "Owner", visible: true, order: 3 },
    ],
    fieldVisibility: { title: true, status: true, owner: true },
    defaultActions: ["open"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_people",
    name: "People",
    description: "Directory of workspace stakeholders and contacts",
    objectTypes: ["Person", "Contact"],
    layoutType: "gallery",
    queryAST: {
      version: 1,
      sort: [{ field: "name", direction: "asc", target: "property" }],
      pagination: { limit: 100 },
    },
    columns: [
      { key: "name", label: "Name", visible: true, order: 1 },
      { key: "email", label: "Email", visible: true, order: 2 },
      { key: "role", label: "Role", visible: true, order: 3 },
    ],
    fieldVisibility: { name: true, email: true, role: true },
    defaultActions: ["open", "email"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: false,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_decisions",
    name: "Decisions",
    description: "Table of key decisions made across meetings and documents",
    objectTypes: ["Decision"],
    layoutType: "table",
    queryAST: {
      version: 1,
      sort: [{ field: "createdAt", direction: "desc", target: "property" }],
      pagination: { limit: 100 },
    },
    columns: [
      { key: "title", label: "Decision", visible: true, order: 1 },
      { key: "impact", label: "Impact", visible: true, order: 2 },
      { key: "status", label: "Status", visible: true, order: 3 },
      { key: "createdAt", label: "Date", visible: true, order: 4 },
    ],
    fieldVisibility: { title: true, impact: true, status: true, createdAt: true },
    defaultActions: ["open"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: false,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_documents",
    name: "Documents",
    description: "List of all documentation, notes, and specifications",
    objectTypes: ["Document"],
    layoutType: "list",
    queryAST: {
      version: 1,
      sort: [{ field: "updatedAt", direction: "desc", target: "property" }],
      pagination: { limit: 100 },
    },
    columns: [
      { key: "title", label: "Title", visible: true, order: 1 },
      { key: "category", label: "Category", visible: true, order: 2 },
      { key: "updatedAt", label: "Last Modified", visible: true, order: 3 },
    ],
    fieldVisibility: { title: true, category: true, updatedAt: true },
    defaultActions: ["open", "edit"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: false,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_recent",
    name: "Recent",
    description: "Timeline view of recently updated knowledge objects across workspace",
    objectTypes: ["Meeting", "Transcript", "Task", "Document", "Project", "Decision"],
    layoutType: "timeline",
    queryAST: {
      version: 1,
      sort: [{ field: "updatedAt", direction: "desc", target: "property" }],
      pagination: { limit: 50 },
    },
    columns: [
      { key: "title", label: "Item", visible: true, order: 1 },
      { key: "type", label: "Type", visible: true, order: 2 },
      { key: "updatedAt", label: "Updated At", visible: true, order: 3 },
    ],
    fieldVisibility: { title: true, type: true, updatedAt: true },
    defaultActions: ["open"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: false,
    version: 1,
  },
  {
    id: "sys_view_today",
    name: "Today",
    description: "Daily dashboard of items scheduled or due today",
    objectTypes: ["Meeting", "Task"],
    layoutType: "list",
    queryAST: {
      version: 1,
      filter: {
        type: "date",
        fieldKey: "scheduledAt",
        operator: "today",
      },
      sort: [{ field: "scheduledAt", direction: "asc", target: "property" }],
      pagination: { limit: 50 },
    },
    columns: [
      { key: "title", label: "Title", visible: true, order: 1 },
      { key: "type", label: "Type", visible: true, order: 2 },
      { key: "scheduledAt", label: "Time", visible: true, order: 3 },
    ],
    fieldVisibility: { title: true, type: true, scheduledAt: true },
    defaultActions: ["open"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: true,
    version: 1,
  },
  {
    id: "sys_view_all_knowledge",
    name: "All Knowledge",
    description: "Master table of every Knowledge Object in the workspace",
    objectTypes: ["Meeting", "Transcript", "AudioAsset", "Task", "Project", "Person", "Decision", "Document"],
    layoutType: "table",
    queryAST: {
      version: 1,
      sort: [{ field: "updatedAt", direction: "desc", target: "property" }],
      pagination: { limit: 500 },
    },
    columns: [
      { key: "title", label: "Title", visible: true, order: 1 },
      { key: "type", label: "Type", visible: true, order: 2 },
      { key: "status", label: "Status", visible: true, order: 3 },
      { key: "createdAt", label: "Created", visible: true, order: 4 },
      { key: "updatedAt", label: "Updated", visible: true, order: 5 },
    ],
    fieldVisibility: { title: true, type: true, status: true, createdAt: true, updatedAt: true },
    defaultActions: ["open", "edit"],
    permissions: { isPublic: true },
    isSystem: true,
    isPinned: true,
    isFavorite: true,
    version: 1,
  },
];

export const seedSystemViews = internalMutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { tenantId, workspaceId } = args;

    for (const viewDef of SYSTEM_VIEW_DEFINITIONS) {
      const existing = await ctx.db
        .query("view_definitions")
        .withIndex("by_id", (q) => q.eq("id", viewDef.id))
        .first();

      const doc = {
        ...viewDef,
        tenantId,
        workspaceId,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.replace(existing._id, doc);
      } else {
        await ctx.db.insert("view_definitions", doc);
      }
    }

    return { seededCount: SYSTEM_VIEW_DEFINITIONS.length };
  },
});
