# Tenant and Workspace Isolation Review Matrix

This document provides a comprehensive review of all repositories and application use cases handling scoped records, evaluating the robustness of multi-tenancy and workspace-isolation controls.

## Isolation Audit Matrix

| Operation | Repository Method | Tenant Param | Workspace Param | Entity ID | Authorization Check | Expected Behavior on Mismatch | Actual Observed Behavior | Risk Level | Evidence Reference |
|---|---|---|---|---|---|---|---|---|---|
| **Get Meeting** | `InMemoryMeetingRepo.get` | Yes | Yes | `meetingId` | `scopeMatch(m, tenantId, workspaceId)` | Return `null` | Returns `null` (throws 404 in GetMeeting use case) | **LOW** | [in-memory.ts:L31-34](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L31-L34) |
| **Save Meeting** | `InMemoryMeetingRepo.save` | No | No | `meeting.id` | None (entity carries context) | N/A (write operation) | Saves entity with creator's scopes | **LOW** | [in-memory.ts:L28-30](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L28-L30) |
| **Get Audio Asset** | `InMemoryAudioAssetRepo.get` | Yes | Yes | `assetId` | `scopeMatch(a, tenantId, workspaceId)` | Return `null` | Returns `null` | **LOW** | [in-memory.ts:L45-48](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L45-L48) |
| **Find Audio by Meeting** | `InMemoryAudioAssetRepo.findByMeeting` | Yes | Yes | `meetingId` | Filters by meeting and `scopeMatch` | Return empty array `[]` | Returns `[]` | **LOW** | [in-memory.ts:L56-58](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L56-L58) |
| **Get Transcript** | `InMemoryTranscriptRepo.get` | Yes | Yes | `transcriptId` | `scopeMatch(t, tenantId, workspaceId)` | Return `null` | Returns `null` | **LOW** | [in-memory.ts:L66-69](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L66-L69) |
| **Find Transcript by Meeting** | `InMemoryTranscriptRepo.findByMeeting` | Yes | Yes | `meetingId` | Filters by meeting and `scopeMatch` | Return empty array `[]` | Returns `[]` | **LOW** | [in-memory.ts:L70-72](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L70-L72) |
| **Get Analysis Run** | `InMemoryAnalysisRunRepo.get` | Yes | Yes | `runId` | `scopeMatch(r, tenantId, workspaceId)` | Return `null` | Returns `null` | **LOW** | [in-memory.ts:L80-83](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L80-L83) |
| **Get Meeting Analysis** | `InMemoryMeetingAnalysisRepo.getByMeeting` | Yes | Yes | `meetingId` | **None** (ignores tenant/workspace parameters) | Return `null` / throw 403 or 404 | **Returns the analysis** matching `meetingId` regardless of scoping | <span style="color:red">**CRITICAL**</span> | [in-memory.ts:L100-102](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L100-L102) |
| **Get Proposed Action** | `InMemoryMeetingAnalysisRepo.getAction` | Yes | Yes | `actionId` | **None** (ignores tenant/workspace parameters) | Return `null` / throw 404 | **Returns the action** matching `actionId` regardless of scoping | <span style="color:red">**CRITICAL**</span> | [in-memory.ts:L112-115](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L112-L115) |
| **Update Proposed Action** | `InMemoryMeetingAnalysisRepo.updateAction` | No | No | `actionId` | **None** (no tenant/workspace context) | Reject write / throw 403 | **Modifies action status** across tenants / workspaces | <span style="color:red">**CRITICAL**</span> | [in-memory.ts:L116-118](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L116-L118) |
| **Save Approval** | `InMemoryMeetingAnalysisRepo.saveApproval` | No | No | `approval.id` | **None** (entity lacks scope fields) | Reject write / throw 403 | Saves approval decision for the action | **HIGH** | [in-memory.ts:L119-121](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L119-L121) |
| **List Actions by Meeting** | `InMemoryMeetingAnalysisRepo.listActionsByMeeting` | Yes | Yes | `meetingId` | **None** (ignores tenant/workspace parameters) | Return empty array `[]` | Returns all matching actions | **HIGH** | [in-memory.ts:L122-124](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L122-L124) |
| **List Audit Events** | `InMemoryAuditRepo.listByMeeting` | Yes | Yes | `meetingId` | `scopeMatch(e, tenantId, workspaceId)` | Return empty array `[]` | Returns empty array `[]` | **LOW** | [in-memory.ts:L132-136](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts#L132-L136) |

---

## Detailed Focus Area Analysis

### 1. `InMemoryMeetingAnalysisRepo`
The repository acts as the primary data interface for post-transcription analytical results. It fails to implement any multi-tenancy verification logic for retrieval methods. Specifically, `getByMeeting` is defined as:
```typescript
async getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null> {
  return [...this.analyses.values()].find((a) => a.meetingId === meetingId) ?? null;
}
```
The signature accepts `tenantId` and `workspaceId` but never calls a comparison against these values. Since `MeetingAnalysis` does not contain `tenantId` or `workspaceId` fields itself (unlike `Meeting` or `Transcript`), there is no way for the repository to verify context directly unless it performs an internal lookup on the parent `Meeting` record.

### 2. `GetMeetingAnalysis` Usecase
The application service [get-analysis.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/analysis/application/get-analysis.ts) fetches the analysis directly:
```typescript
async execute(meetingId: string): Promise<MeetingAnalysis> {
  const a = await this.ctx.repos.meetingAnalysis.getByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
  if (!a) throw new AppError(ErrorCode.NOT_FOUND, "Analysis not found", 404);
  return a;
}
```
Because the use case does not verify that the meeting belongs to the caller's tenant/workspace before querying the analysis, and the analysis repository itself ignores tenant/workspace parameters, any client with a valid meeting ID can read any other tenant's meeting analysis.

### 3. `AnalyzeMeetingTranscript` Usecase
This usecase ([analyze-transcript.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/analysis/application/analyze-transcript.ts)) is partially saved by the fact that the source transcript lookup uses `findByMeeting` which *does* enforce tenant/workspace scopes:
```typescript
const transcripts = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
const transcript = transcripts.find((t) => t.status === "READY");
if (!transcript) throw new AppError(ErrorCode.VALIDATION_ERROR, "No valid transcript to analyze", 400);
```
However, later in the save process:
```typescript
const analysis: MeetingAnalysis = { ...validated.data, id: randomUUID(), meetingId };
await this.ctx.repos.meetingAnalysis.save(analysis);
```
The saved analysis has no tenant/workspace markings, and downstream reads from `getByMeeting` bypass checks. Furthermore, the analysis idempotency check is:
```typescript
const existingRun = await this.ctx.repos.analysisRun.findByIdempotencyKey(idempotencyKey);
```
Where `findByIdempotencyKey` in the repository does not enforce scope verification, creating a secondary risk.

### 4. Action Approvals and Rejections Lookup
In [approve-reject.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/approvals/application/approve-reject.ts):
```typescript
const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);
```
The repository method `getAction` ignores the tenant and workspace parameters. The use case does not verify the parent meeting's ownership of the action either, allowing an attacker to approve or reject proposed actions belonging to other tenants.

### 5. Audit-Event Retrieval
The audit retrieval logic in [list-audit.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/audit/application/list-audit.ts) is properly protected:
```typescript
const m = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
if (!m) throw new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404);
return this.ctx.repos.audit.listByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
```
Because the `meeting.get` call enforces tenant/workspace scope (returning `null` if they mismatch), any access to another tenant's meeting audit trail is rejected with a `404 Meeting not found` error before reaching the audit repository.
