import type { IKnowledgeRepository } from "./repository";
import type { CanonicalKnowledgeObject, KnowledgeObjectType } from "../../shared/domain/types";
import { KnowledgeObjectSchema } from "./schemas";

export class KnowledgeService {
  constructor(private repo: IKnowledgeRepository) {}

  async createKnowledgeObject(input: {
    type: KnowledgeObjectType;
    tenantId: string;
    workspaceId: string;
    title: string;
    summary?: string;
    body?: string;
    properties?: Record<string, any>;
    labels?: string[];
    createdBy: string;
  }): Promise<CanonicalKnowledgeObject> {
    const now = Date.now();
    const id = `ko_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const rawObject: CanonicalKnowledgeObject = {
      id,
      type: input.type,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      title: input.title,
      summary: input.summary,
      body: input.body,
      properties: input.properties || {},
      metadata: {},
      labels: input.labels || [],
      relationships: [],
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      status: "active",
      visibility: "Workspace",
      version: 1,
    };

    const validated = KnowledgeObjectSchema.parse(rawObject) as CanonicalKnowledgeObject;
    await this.repo.save(validated);
    return validated;
  }

  async getObjectById(id: string): Promise<CanonicalKnowledgeObject | null> {
    return await this.repo.findById(id);
  }

  async getObjectsByWorkspace(
    tenantId: string,
    workspaceId: string,
    type?: KnowledgeObjectType
  ): Promise<CanonicalKnowledgeObject[]> {
    return await this.repo.listByWorkspace(tenantId, workspaceId, type);
  }

  async addRelationship(
    sourceId: string,
    targetId: string,
    relationType: string
  ): Promise<void> {
    const sourceObj = await this.repo.findById(sourceId);
    if (!sourceObj) throw new Error(`Object with id ${sourceId} not found`);

    const updatedRelationships = [
      ...sourceObj.relationships.filter((r) => r.targetId !== targetId),
      { targetId, relationType },
    ];

    const updatedObj: CanonicalKnowledgeObject = {
      ...sourceObj,
      relationships: updatedRelationships,
      updatedAt: Date.now(),
      version: sourceObj.version + 1,
    };

    await this.repo.save(updatedObj);
  }
}

export class TaskService {
  constructor(private knowledgeService: KnowledgeService) {}

  async createTask(input: {
    tenantId: string;
    workspaceId: string;
    title: string;
    summary?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    dueDate?: string;
    assigneeId?: string;
    createdBy: string;
    relatedMeetingId?: string;
  }): Promise<CanonicalKnowledgeObject> {
    const taskObj = await this.knowledgeService.createKnowledgeObject({
      type: "Task",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      title: input.title,
      summary: input.summary,
      properties: {
        priority: input.priority || "medium",
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
      },
      labels: ["task"],
      createdBy: input.createdBy,
    });

    if (input.relatedMeetingId) {
      await this.knowledgeService.addRelationship(
        taskObj.id,
        input.relatedMeetingId,
        "extracted_from_meeting"
      );
    }

    return (await this.knowledgeService.getObjectById(taskObj.id)) || taskObj;
  }
}

export class MeetingService {
  constructor(private knowledgeService: KnowledgeService) {}

  async createMeeting(input: {
    tenantId: string;
    workspaceId: string;
    title: string;
    meetingType?: string;
    scheduledAt?: string;
    createdBy: string;
  }): Promise<CanonicalKnowledgeObject> {
    return await this.knowledgeService.createKnowledgeObject({
      type: "Meeting",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      title: input.title,
      properties: {
        meetingType: input.meetingType || "general",
        scheduledAt: input.scheduledAt || new Date().toISOString(),
      },
      labels: ["meeting"],
      createdBy: input.createdBy,
    });
  }
}
