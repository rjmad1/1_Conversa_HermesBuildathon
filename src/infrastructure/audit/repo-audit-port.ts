import { randomUUID } from "node:crypto";
import type { AuditRepo } from "../../modules/meetings/domain/repositories";
import type { AuditPort } from "../../modules/audit/domain/port";
import type { AuditEvent } from "../../shared/validation/schemas";

export class RepoAuditPort implements AuditPort {
  constructor(private readonly repo: AuditRepo) {}

  async record(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
    const full: AuditEvent = {
      ...event,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.repo.append(full);
  }
}
