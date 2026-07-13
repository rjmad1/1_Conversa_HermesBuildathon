# Conversa — Requirements Specification

---
### 📋 Document Metadata
- **Purpose**: Consolidates functional, non-functional, security, and acceptance requirements into a single canonical requirements catalog.
- **Audience**: Engineering leads, QA architects, product managers, and compliance officers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in existing functional requirements, non-functional targets, and validation suites).
- **Evidence Used**: Core project specifications (`docs/functional-audio-first.md`, `docs/non-functional.md`, `docs/acceptance-criteria.md`).
- **Cross References**: See [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md), [FEATURES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/FEATURES.md), [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md).
- **Open Questions**: Rotation policy for Bearer tokens in production.
- **Known Limitations**: Ephemeral database limits live multi-tenant scalability testing.
- **Recommended Next Actions**: Establish automated compliance checklist verification in the CI/CD pipeline.
---

## 1. Functional Requirements

### 1.1 Supported Ingestion Channels
* **Audio Upload**: Support MP3 (`audio/mpeg`), WAV (`audio/wav`), and M4A (`audio/mp4`) uploads.
* **Recorded Audio Import**: Import audio files recorded on third-party conferencing platforms (Zoom, Google Meet, MS Teams).
* **Pasted/Imported Transcripts**: Support direct text input of transcripts (min 10 characters), bypassing transcription.

### 1.2 User Journeys & Stories
* **US-1: Upload & Transcribe Audio**: Users can upload audio files within configured size and type limits. The platform creates a `AudioAsset` and triggers transcription.
* **US-2: Paste Transcript (BYOK)**: Users can paste plain-text transcripts. Under production configurations, an OpenAI API key must be supplied to execute the specialist analysis.
* **US-3: Review & Approve Actions**: Users can review proposed actions (including priority, owner, and due dates) and approve or reject them. Approved items are persisted; rejected items are discarded.
* **US-4: Reject Video Ingestion**: Any video upload must be rejected immediately at the boundary with `415 UNSUPPORTED_MEDIA_TYPE`.
* **US-5: Retry on Failures**: Any failure during transcription or analysis must transition the meeting into a recoverable state allowing the user to retry.

### 1.3 Modular Scope Map
* **Meeting Manager**: CRUD lifecycle for meetings.
* **Media / Ingestion**: Security validation and scope routing.
* **Transcription Service**: Boundary to convert audio to plain text.
* **Meeting Agency**: Coordinator orchestrating specialist extraction.
* **Human-in-the-loop (HITL)**: Approval-gating proposed findings.
* **Governance**: Immutable audit trails of operations.

---

## 2. Non-Functional Requirements (NFRs)

### 2.1 Performance & Latency
* **Ingestion Latency**: End-to-end processing (upload to transcript display) must complete in $< 30$ seconds for files $\le 10$ MB.
* **Analysis Latency**: Agent suggestion generation must complete in $< 15$ seconds.
* **Upload Progress**: Stream file upload progress to the client interface.

### 2.2 Scalability & Concurrency
* **Stateless Handlers**: Backend REST router must remain stateless to support serverless horizontal scaling.
* **Scoped Storage**: All media and metadata references must be tenant and workspace scoped, allowing partitioning across database shards.

### 2.3 Security & Isolation
* **Tenancy Boundaries**: Multi-tenant isolation must be enforced server-side. Production callers must be locked into demo scopes.
* **PII Redaction**: Raw audio files must never be written to logs. Log outputs must be recursively redacted up to depth 10.
* **Access Control (RBAC)**: Centralized token-based authentication mapping to `admin`, `approver`, and `viewer` roles.

### 2.4 Accessibility (a11y)
* **Keyboard Navigation**: Ingestion forms and review panels must be fully keyboard operable.
* **ARIA Standards**: Proper ARIA descriptors for progress bars, buttons, and alert cards.

---

## 3. System Constraints
* **Audio Limit (Size)**: Maximum file size is capped by `AUDIO_MAX_BYTES` (default: 10MB).
* **Audio Limit (Duration)**: Maximum audio duration is capped by `AUDIO_MAX_SECONDS` (default: 2 hours).
* **Network Limit**: Vercel execution timeouts cap single HTTP requests at 60 seconds.
* **Persistence Limit**: The baseline memory-mapped database is ephemeral and loses state on system restarts.

---

## 4. Acceptance Criteria (The 10 Gates)
1. **No video requirements**: No product flow or user journey uses video.
2. **No webcam prompts**: No browser camera controls or permission prompts exist.
3. **API blocks video**: Endpoint rejects video uploads with `415 UNSUPPORTED_MEDIA_TYPE`.
4. **Validation feedback**: Error messages specify supported types (MP3, WAV, M4A).
5. **Transcription flow**: MP3, WAV, and M4A follow the ingestion flow.
6. **Passthrough transcript**: Pasted transcripts run analysis without requiring audio.
7. **Module separation**: Audio ingestion and meeting analysis are in distinct files.
8. **Consistent documentation**: No promotional content describes video capabilities.
9. **ADR Alignment**: Future video roadmap is documented as a deferred option.
10. **Build & Quality CI**: Types, linter, tests, and building processes pass.
