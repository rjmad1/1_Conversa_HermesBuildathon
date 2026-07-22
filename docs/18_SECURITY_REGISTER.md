# 18 — Security Register

- **Platform Name**: Conversa Security System
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🔒 Security Architecture & Controls Audit

### 1. Authentication & Identity Validation (`src/shared/security/identity.ts`)
* Dual-mode authentication supporting Clerk session tokens (`@clerk/nextjs`) and API Bearer tokens (`Authorization: Bearer <token>`).
* Tenant boundary isolation enforcing `workspaceId` checks on every database read/write operation.

### 2. Broken Object Level Authorization (BOLA) Defense
* Every Convex query and mutation verifies that the requesting identity possesses explicit access rights to the targeted `workspaceId` and `meetingId`.
* Direct cross-tenant node or edge references in the Living Knowledge Graph are rejected by schema validators.

### 3. Data Privacy & Classification Masking
* 5 strict privacy levels enforced across the evidence blackboard and semantic publication bus:
  1. `Public`: Unrestricted viewing.
  2. `Internal`: Restricted to verified organization members.
  3. `Confidential`: Restricted to meeting attendees and explicit workspace owners.
  4. `Restricted`: Redacts PII and confidential financial/legal metadata.
  5. `Regulated`: Enforces data residency boundaries (`US`, `EU`, `India`, `Global`, `CustomerManaged`, `AirGapped`) with complete on-prem processing guarantees.

### 4. Recursive Payload Log Redaction (`src/shared/logging/logger.ts`)
* All diagnostic logger outputs automatically sanitize sensitive key patterns (`api_key`, `password`, `token`, `secret`, `ssn`, `credit_card`) prior to emitting JSON stdout.
