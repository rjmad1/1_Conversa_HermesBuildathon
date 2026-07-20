import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meetings: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    title: v.string(),
    meetingType: v.string(),
    status: v.string(),
    scheduledAt: v.string(),
    createdBy: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  transcripts: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    meetingId: v.string(),
    source: v.string(),
    language: v.string(),
    content: v.string(),
    segments: v.array(v.object({
      speaker: v.union(v.string(), v.null()),
      startMs: v.number(),
      endMs: v.number(),
      text: v.string(),
    })),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_meeting", ["meetingId"])
    .index("by_id", ["id"]),

  audio_assets: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    meetingId: v.string(),
    source: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    format: v.object({
      codec: v.string(),
      channels: v.number(),
      sampleRate: v.number(),
      bitrate: v.optional(v.number()),
    }),
    sizeBytes: v.number(),
    durationSeconds: v.number(),
    checksum: v.string(),
    storageReference: v.string(),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_meeting", ["meetingId"])
    .index("by_checksum", ["tenantId", "workspaceId", "meetingId", "checksum"])
    .index("by_id", ["id"]),

  waitlist: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    email: v.string(),
    createdAt: v.string(),
    source: v.union(v.string(), v.null()),
    campaign: v.union(v.string(), v.null()),
    consent: v.boolean(),
  }).index("by_email", ["tenantId", "workspaceId", "email"]),

  knowledge_objects: defineTable({
    id: v.string(),
    type: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    body: v.optional(v.string()),
    properties: v.any(),
    metadata: v.any(),
    labels: v.array(v.string()),
    relationships: v.array(v.object({
      targetId: v.string(),
      relationType: v.string(),
    })),
    source: v.optional(v.string()),
    createdBy: v.string(),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.string(),
    visibility: v.string(),
    aiContext: v.optional(v.any()),
    executionMetadata: v.optional(v.any()),
    version: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_type", ["tenantId", "workspaceId", "type"])
    .index("by_id", ["id"]),

  object_types: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    parentTypeId: v.optional(v.string()),
    fieldDefinitions: v.array(v.string()),
    defaultViewId: v.optional(v.string()),
    supportedViewIds: v.array(v.string()),
    defaultActionIds: v.array(v.string()),
    validationRules: v.any(),
    systemType: v.boolean(),
    isExtensible: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  field_definitions: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    key: v.string(),
    name: v.string(),
    type: v.string(),
    required: v.boolean(),
    defaultValue: v.optional(v.any()),
    constraints: v.optional(v.any()),
    validation: v.optional(v.any()),
    description: v.optional(v.string()),
    displayOptions: v.optional(v.any()),
    searchable: v.boolean(),
    filterable: v.boolean(),
    sortable: v.boolean(),
    aiVisible: v.boolean(),
    editable: v.boolean(),
    hidden: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_key", ["tenantId", "workspaceId", "key"])
    .index("by_id", ["id"]),

  templates: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    objectTypeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    defaultProperties: v.any(),
    defaultLabels: v.array(v.string()),
    defaultRelationships: v.array(
      v.object({
        targetId: v.string(),
        relationType: v.string(),
      })
    ),
    defaultActions: v.array(v.string()),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_object_type", ["tenantId", "workspaceId", "objectTypeId"])
    .index("by_id", ["id"]),

  validation_rules: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    name: v.string(),
    ruleType: v.string(),
    params: v.any(),
    errorMessage: v.string(),
    severity: v.string(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  view_definitions: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    objectTypeId: v.optional(v.string()), // Legacy support
    objectTypes: v.optional(v.array(v.string())), // Multi-type targets
    name: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.string()), // Legacy support
    layoutType: v.optional(v.string()),
    config: v.optional(v.any()),
    queryAST: v.optional(v.any()),
    columns: v.optional(v.any()),
    fieldVisibility: v.optional(v.any()),
    defaultActions: v.optional(v.array(v.string())),
    permissions: v.optional(v.any()),
    savedState: v.optional(v.any()),
    isDefault: v.optional(v.boolean()),
    isSystem: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    parentViewId: v.optional(v.string()),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_object_type", ["tenantId", "workspaceId", "objectTypeId"])
    .index("by_system", ["tenantId", "workspaceId", "isSystem"])
    .index("by_id", ["id"]),

  view_overrides: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    userId: v.optional(v.string()),
    parentViewId: v.string(),
    overrideType: v.string(),
    delta: v.any(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_parent_view", ["tenantId", "workspaceId", "parentViewId"])
    .index("by_user_parent", ["tenantId", "workspaceId", "userId", "parentViewId"])
    .index("by_id", ["id"]),

  action_definitions: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    name: v.string(),
    actionType: v.string(),
    config: v.any(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  relationship_types: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    code: v.string(),
    name: v.string(),
    inverseCode: v.optional(v.string()),
    description: v.optional(v.string()),
    allowedSourceTypes: v.array(v.string()),
    allowedTargetTypes: v.array(v.string()),
    cardinality: v.optional(v.string()),
    allowCycles: v.optional(v.boolean()),
    allowSelfReference: v.optional(v.boolean()),
    metadataSchema: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_code", ["tenantId", "workspaceId", "code"])
    .index("by_id", ["id"]),

  graph_edges: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    sourceId: v.string(),
    targetId: v.string(),
    relationType: v.string(),
    metadata: v.optional(v.any()),
    createdBy: v.string(),
    updatedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.number(),
    status: v.string(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_source", ["tenantId", "workspaceId", "sourceId"])
    .index("by_target", ["tenantId", "workspaceId", "targetId"])
    .index("by_relation_type", ["tenantId", "workspaceId", "relationType"])
    .index("by_pair", ["tenantId", "workspaceId", "sourceId", "targetId", "relationType"])
    .index("by_id", ["id"]),

  workspace_metadata: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    installedPlugins: v.array(v.string()),
    settings: v.any(),
    version: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_id", ["id"]),

  saved_searches: defineTable({
    id: v.string(),
    tenantId: v.string(),
    workspaceId: v.string(),
    userId: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    queryAST: v.any(),
    rankingProfile: v.optional(v.string()),
    contextProfile: v.optional(v.string()),
    defaultViewId: v.optional(v.string()),
    scope: v.string(),
    isFavorite: v.boolean(),
    usageCount: v.number(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_workspace", ["tenantId", "workspaceId"])
    .index("by_scope", ["tenantId", "workspaceId", "scope"])
    .index("by_user", ["tenantId", "workspaceId", "userId"])
    .index("by_id", ["id"]),
});

