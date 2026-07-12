import type { AuditEvent } from "../../../shared/validation/schemas";

export interface AuditPort {
  record(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void>;
}
