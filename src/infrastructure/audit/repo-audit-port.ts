import { randomUUID } from "node:crypto";
import type { AuditRepo } from "../../modules/meetings/domain/repositories";
import type { AuditPort } from "../../modules/audit/domain/port";
import type { AuditEvent } from "../../shared/validation/schemas";

import { CryptographicAuditTrail } from "../../shared/security/cryptographic-audit";

export class RepoAuditPort implements AuditPort {
  constructor(private readonly repo: AuditRepo) {}

  async record(event: Omit<AuditEvent, "id" | "createdAt" | "hash" | "previousHash">): Promise<void> {
    const existing = await this.repo.listByMeeting(event.tenantId, event.workspaceId, event.meetingId);
    const lastEvent = existing[existing.length - 1];
    const previousHash = lastEvent?.hash || "0";

    const full: AuditEvent = {
      ...event,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      previousHash,
    };

    full.hash = CryptographicAuditTrail.calculateHash(full, previousHash);
    await this.repo.append(full);
  }
}
