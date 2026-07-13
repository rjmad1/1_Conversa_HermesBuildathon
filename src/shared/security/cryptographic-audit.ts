import { createHash } from "node:crypto";
import type { AuditEvent } from "../validation/schemas";

export class CryptographicAuditTrail {
  static calculateHash(event: AuditEvent, previousHash: string): string {
    const dataToHash = {
      id: event.id,
      tenantId: event.tenantId,
      workspaceId: event.workspaceId,
      meetingId: event.meetingId,
      entityType: event.entityType,
      entityId: event.entityId,
      eventType: event.eventType,
      actorType: event.actorType,
      actorId: event.actorId,
      correlationId: event.correlationId,
      metadata: event.metadata,
      createdAt: event.createdAt,
    };

    return createHash("sha256")
      .update(JSON.stringify(dataToHash) + previousHash)
      .digest("hex");
  }

  static verifyChain(events: AuditEvent[]): boolean {
    if (!events || events.length === 0) return true;

    // Verify first event has previousHash = "0" (or check genesis)
    let expectedPrevHash = "0";

    for (const e of events) {
      if (e.previousHash !== expectedPrevHash) {
        return false;
      }
      const computed = this.calculateHash(e, expectedPrevHash);
      if (e.hash !== computed) {
        return false;
      }
      expectedPrevHash = e.hash;
    }

    return true;
  }
}
