import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const seedSystemMetadata = internalMutation({
  args: {
    tenantId: v.string(),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { tenantId, workspaceId } = args;

    // Helper to insert field if not exists
    const upsertField = async (field: any) => {
      const existing = await ctx.db
        .query("field_definitions")
        .withIndex("by_id", (q) => q.eq("id", field.id))
        .first();
      if (existing) {
        await ctx.db.replace(existing._id, field);
      } else {
        await ctx.db.insert("field_definitions", field);
      }
    };

    // Helper to insert object type if not exists
    const upsertType = async (typeDef: any) => {
      const existing = await ctx.db
        .query("object_types")
        .withIndex("by_id", (q) => q.eq("id", typeDef.id))
        .first();
      if (existing) {
        await ctx.db.replace(existing._id, typeDef);
      } else {
        await ctx.db.insert("object_types", typeDef);
      }
    };

    // 1. Seed Core Fields
    const fieldScheduledAt = {
      id: "field_sys_scheduled_at",
      tenantId,
      workspaceId,
      key: "scheduledAt",
      name: "Scheduled Date & Time",
      type: "DateTime",
      required: false,
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldMeetingType = {
      id: "field_sys_meeting_type",
      tenantId,
      workspaceId,
      key: "meetingType",
      name: "Meeting Type",
      type: "Select",
      required: true,
      defaultValue: "general",
      constraints: { options: ["general", "standup", "sprint_planning", "1on1", "client", "retrospective"] },
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldPriority = {
      id: "field_sys_priority",
      tenantId,
      workspaceId,
      key: "priority",
      name: "Priority",
      type: "Select",
      required: true,
      defaultValue: "medium",
      constraints: { options: ["low", "medium", "high", "urgent"] },
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldDueDate = {
      id: "field_sys_due_date",
      tenantId,
      workspaceId,
      key: "dueDate",
      name: "Due Date",
      type: "Date",
      required: false,
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldAssigneeId = {
      id: "field_sys_assignee_id",
      tenantId,
      workspaceId,
      key: "assigneeId",
      name: "Assignee",
      type: "Reference",
      required: false,
      constraints: { allowedTargetTypes: ["type_sys_person"] },
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldImpactArea = {
      id: "field_sys_impact_area",
      tenantId,
      workspaceId,
      key: "impactArea",
      name: "Impact Area",
      type: "Text",
      required: false,
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const fieldEmail = {
      id: "field_sys_email",
      tenantId,
      workspaceId,
      key: "email",
      name: "Email Address",
      type: "Email",
      required: false,
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await upsertField(fieldScheduledAt);
    await upsertField(fieldMeetingType);
    await upsertField(fieldPriority);
    await upsertField(fieldDueDate);
    await upsertField(fieldAssigneeId);
    await upsertField(fieldImpactArea);
    await upsertField(fieldEmail);

    // 2. Seed Base WorkItem Object Type
    const typeWorkItem = {
      id: "type_sys_work_item",
      tenantId,
      workspaceId,
      name: "Work Item",
      icon: "check-square",
      color: "#6366F1",
      description: "Base abstract type for executable tasks and bugs",
      fieldDefinitions: ["field_sys_priority", "field_sys_due_date", "field_sys_assignee_id"],
      supportedViewIds: ["list", "table", "board"],
      defaultActionIds: ["action_sys_complete"],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    // 3. Seed Specialized Object Types inheriting or standalone
    const typeTask = {
      id: "type_sys_task",
      tenantId,
      workspaceId,
      name: "Task",
      icon: "check-circle",
      color: "#10B981",
      description: "Actionable item with due date and priority",
      parentTypeId: "type_sys_work_item",
      fieldDefinitions: [], // Inherits WorkItem fields
      supportedViewIds: ["list", "table", "board"],
      defaultActionIds: ["action_sys_complete"],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const typeMeeting = {
      id: "type_sys_meeting",
      tenantId,
      workspaceId,
      name: "Meeting",
      icon: "calendar",
      color: "#3B82F6",
      description: "Recorded or scheduled meeting event",
      fieldDefinitions: ["field_sys_scheduled_at", "field_sys_meeting_type"],
      supportedViewIds: ["list", "table", "calendar"],
      defaultActionIds: ["action_sys_transcribe"],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const typeDecision = {
      id: "type_sys_decision",
      tenantId,
      workspaceId,
      name: "Decision",
      icon: "git-commit",
      color: "#F59E0B",
      description: "Recorded organizational or project decision",
      fieldDefinitions: ["field_sys_impact_area"],
      supportedViewIds: ["list", "table"],
      defaultActionIds: [],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const typePerson = {
      id: "type_sys_person",
      tenantId,
      workspaceId,
      name: "Person",
      icon: "user",
      color: "#8B5CF6",
      description: "Individual stakeholder or user profile",
      fieldDefinitions: ["field_sys_email"],
      supportedViewIds: ["list", "table"],
      defaultActionIds: [],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await upsertType(typeWorkItem);
    await upsertType(typeTask);
    await upsertType(typeMeeting);
    await upsertType(typeDecision);
    await upsertType(typePerson);
  },
});
