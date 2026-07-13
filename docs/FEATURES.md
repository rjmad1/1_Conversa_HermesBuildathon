# Conversa — Feature Catalog

---
### 📋 Document Metadata
- **Purpose**: Catalogs all functional features, status, owners, technical risks, and future plans.
- **Audience**: Product managers, architects, QA managers, and developers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Direct correlation with files in `src/modules` and router endpoints).
- **Evidence Used**: Root routes, repository interfaces, and test scenarios.
- **Cross References**: See [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md), [REQUIREMENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/REQUIREMENTS.md), [AGENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/AGENTS.md).
- **Open Questions**: Rotation guidelines for static tokens in production.
- **Known Limitations**: Ephemeral DB limits long-term feature verification.
- **Recommended Next Actions**: Hook up notifications on action approvals.
---

## 1. Feature Map & Matrix

| Feature ID | Feature Name | Component / Module | Status | Owner |
| --- | --- | --- | --- | --- |
| **F-01** | Meeting Setup & CRUD | `src/modules/meetings` | Completed | PM |
| **F-02** | Secure Audio Ingestion | `src/modules/media` | Completed | Security / Media |
| **F-03** | Audio Transcription | `src/modules/transcription` | Completed | AI Engineer |
| **F-04** | Plain Text Transcript Submission | `src/modules/meetings` | Completed | PM |
| **F-05** | Multi-Agent Meeting Analysis Crew | `src/modules/agency` | Completed | AI Systems Architect |
| **F-06** | Handoff Protocols & Revision Loops | `src/modules/agency` | Completed | AI Systems Architect |
| **F-07** | Human-in-the-Loop Action Approval | `src/modules/approvals` | Completed | PM |
| **F-08** | Tenancy Isolation & RBAC Gates | `src/shared/security` | Completed | Security Architect |
| **F-09** | Rate Limiting & Body Limits | `src/app/index.ts` | Completed | Platform Engineer |
| **F-10** | Tenant-Isolated Workspace Reset | `src/infrastructure` | Completed | DevOps |
| **F-11** | Immutable Audit Logs | `src/modules/audit` | Completed | Compliance Officer |
| **F-12** | SRE Telemetry & Cost Tracking | `src/shared/observability` | Completed | SRE |

---

## 2. Feature Details

### F-01: Meeting Setup & CRUD
* **Description**: Create and retrieve meetings, storing metadata (title, scheduledAt, meetingType).
* **Technical Risk**: Low.
* **Future Improvements**: Add search, sorting, and pagination for large lists.

### F-02: Secure Audio Ingestion
* **Description**: Validate file sizes, verify MIME types (MP3, WAV, M4A), and hash the file to calculate checksums to prevent duplicates. Scopes audio references by `tenantId` and `workspaceId`.
* **Technical Risk**: Medium. File type spoofing is restricted but requires deep header inspection in production.
* **Future Improvements**: Move file validation to edge workers.

### F-05: Multi-Agent Meeting Analysis Crew
* **Description**: An orchestration agent (`Meeting Manager`) creates a plan and sequences specialized specialist agents (`Decision`, `Risk`, and `Action Specialists`) using the OpenAI API.
* **Technical Risk**: High (Model hallucination or failure). Managed by the QA Reviewer agent.
* **Future Improvements**: support offline-first local LLM execution.

### F-06: Handoff Protocols & Revision Loops
* **Description**: Passes state envelopes (`AgentHandoff`) containing context, prior findings, and policies between agents. If the `QA_REVIEWER` detects a policy violation (e.g. action lacking due date), it requests a revision. If the revision limit (1) is exceeded, it escalates the step.
* **Technical Risk**: Medium (revision loops can hang). Mitigated by a hard loop limit (1 revision max).
* **Future Improvements**: Add detailed trace visualization on the UI.

### F-07: Human-in-the-Loop Action Approval
* **Description**: Gated mutations. Action items proposed by agents must be manually approved or rejected by a user with `approver` or `admin` roles.
* **Technical Risk**: Low.
* **Future Improvements**: Add Webhook integration to push approved actions to Jira or Slack.

### F-08: Tenancy Isolation & RBAC Gates
* **Description**:Production auth (`ProdIdentityAdapter`) validates Bearer tokens, resolves roles, and scopes tenancy. central authorization middleware (`authGuard`) restricts mutation endpoints.
* **Technical Risk**: Low (Fully covered by security regression suites).
* **Future Improvements**: Migrate to OAuth2 and JWT validation.

### F-10: Tenant-Isolated Workspace Reset
* **Description**: Admin-gated endpoint `POST /api/v1/workspace/reset` clears all database maps corresponding to the caller's tenant and workspace.
* **Technical Risk**: High (Data loss). Mitigated by strict role checks (`admin` role only) and audit logging.
* **Future Improvements**: Add multi-factor confirmation before resetting.
