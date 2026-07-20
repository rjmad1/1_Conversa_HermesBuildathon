import { describe, it, expect } from "vitest";
import { KnowledgeObjectSchema } from "../../src/modules/knowledge/schemas";
import { InMemoryKnowledgeRepository } from "../../src/modules/knowledge/repository";
import { KnowledgeService, TaskService, MeetingService } from "../../src/modules/knowledge/services";

describe("Canonical Knowledge Objects & Services", () => {
  it("validates a canonical knowledge object schema", () => {
    const validObject = {
      id: "ko-test-1",
      type: "Meeting" as const,
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      title: "Test Architecture Sync",
      summary: "Syncing KnowledgeObject schema",
      properties: { meetingType: "architecture" },
      metadata: {},
      labels: ["sync"],
      relationships: [],
      createdBy: "usr-1",
      updatedBy: "usr-1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active",
      visibility: "Workspace" as const,
      version: 1,
    };

    const parsed = KnowledgeObjectSchema.parse(validObject);
    expect(parsed.id).toBe("ko-test-1");
    expect(parsed.type).toBe("Meeting");
  });

  it("creates and retrieves knowledge objects via KnowledgeService", async () => {
    const repo = new InMemoryKnowledgeRepository();
    const service = new KnowledgeService(repo);

    const created = await service.createKnowledgeObject({
      type: "Document",
      tenantId: "t-1",
      workspaceId: "ws-1",
      title: "Conversa AegisOS Integration Spec",
      body: "# AegisOS Integration Specs\n...",
      createdBy: "usr-1",
    });

    expect(created.id).toBeDefined();
    expect(created.type).toBe("Document");

    const retrieved = await service.getObjectById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe("Conversa AegisOS Integration Spec");
  });

  it("creates tasks and links relationships to meetings", async () => {
    const repo = new InMemoryKnowledgeRepository();
    const kService = new KnowledgeService(repo);
    const mService = new MeetingService(kService);
    const tService = new TaskService(kService);

    const meeting = await mService.createMeeting({
      tenantId: "t-1",
      workspaceId: "ws-1",
      title: "Quarterly Strategy Meeting",
      createdBy: "usr-1",
    });

    const task = await tService.createTask({
      tenantId: "t-1",
      workspaceId: "ws-1",
      title: "Draft AegisOS Event Bus Specs",
      priority: "high",
      createdBy: "usr-1",
      relatedMeetingId: meeting.id,
    });

    expect(task.type).toBe("Task");
    expect(task.properties.priority).toBe("high");
    expect(task.relationships).toHaveLength(1);
    expect(task.relationships[0]!.targetId).toBe(meeting.id);
    expect(task.relationships[0]!.relationType).toBe("extracted_from_meeting");
  });
});
