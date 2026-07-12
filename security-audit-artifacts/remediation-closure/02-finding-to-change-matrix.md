# Finding-to-Change Matrix

This matrix maps each security audit finding to the code files changed, invariants introduced, and regression test suites.

## Matrix

| Finding ID | Title | Root Cause | Files Changed | Security Invariant Introduced | Tests Added | Status |
|---|---|---|---|---|---|---|
| **AUDIT-001** | Cross-Tenant Meeting Analysis Read Leak | `InMemoryMeetingAnalysisRepo.getByMeeting` ignored scopes. `GetMeetingAnalysis` usecase bypassed meeting verification. | [in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts)<br>[repositories.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/meetings/domain/repositories.ts)<br>[analyze-transcript.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/analysis/application/analyze-transcript.ts) | Reads to `MeetingAnalysis` perform lookup on parent `Meeting` using incoming scopes. Mismatches return `null` immediately. | `tests/integration/adversarial.spec.ts` ("Tenant A can read own meeting analysis...") | **CLOSED** |
| **AUDIT-002** | Cross-Tenant Proposed Action Mutability | `InMemoryMeetingAnalysisRepo.getAction` and update calls ignored parameters. Usecases validated state before scopes. | [in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/repositories/in-memory.ts)<br>[repositories.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/meetings/domain/repositories.ts)<br>[approve-reject.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/approvals/application/approve-reject.ts) | Actions retrieve parent meetings to confirm caller ownership. Usecases perform action scope verification before applying state validations or mutating items. | `tests/integration/adversarial.spec.ts` ("Tenant B / Workspace B cannot read, approve...") | **CLOSED** |
| **AUDIT-003** | Inoperable OpenAI Transcription Adapter | Provider passed reference string instead of audio bytes to OpenAI SDK. | [openai.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/openai.ts)<br>[transcribe-audio.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/transcription/application/transcribe-audio.ts)<br>[provider.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/transcription/domain/provider.ts) | Audio bytes are fetched from `AudioStorage` and converted to Hono/DOM `File` objects before submitting to OpenAI SDK. | `tests/integration/flow.spec.ts` (happy path & alternate path tests) | **CLOSED** |
| **AUDIT-004** | Non-Portable Logger Runtime Crash | Direct call to Node-only stream `process.stdout.write`. | [logger.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/logging/logger.ts) | Implemented LogSink runtime capability checking (detects `process.stdout` and falls back to `console.log` automatically). | `tests/integration/adversarial.spec.ts` ("logger operates cleanly...") | **CLOSED** |
| **AUDIT-005** | Shallow Log Redaction | `redact()` checked keys only at the root level. | [redaction.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/shared/security/redaction.ts) | Recursive, deep-copy redaction checking nested objects, arrays, and circular references up to depth 10. | `tests/integration/adversarial.spec.ts` ("recursive redaction handles...") | **CLOSED** |

---

## Technical Validation Evidence

The changes compile with zero TypeScript errors. Regression test suites run and verify all boundaries. All findings are marked as **CLOSED**.
