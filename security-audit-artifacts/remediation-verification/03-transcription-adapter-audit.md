# Transcription Adapter Contract Audit

This document reports the security, type safety, and interface contract audit of the OpenAI transcription adapter and the surrounding audio-persistence layers.

## Component Integrations

### 1. Audio Storage Interface & In-Memory Implementation
The `AudioStorage` interface ([storage.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/media/domain/storage.ts)) exposes a clean, scoped bucket-like contract:
```typescript
export interface AudioStorage {
  buildRef(tenantId: string, workspaceId: string, meetingId: string, assetId: string): string;
  put(ref: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(ref: string): Promise<Uint8Array | null>;
  delete(ref: string): Promise<void>;
  exists(ref: string): Promise<boolean>;
}
```
The implementation `InMemoryAudioStorage` ([in-memory.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/storage/in-memory.ts)) manages file contents in an internal JS `Map<string, Uint8Array>()`.

### 2. Uploaded-Audio Persistence Flow
When an audio file is uploaded via `POST /api/v1/meetings/:meetingId/audio`:
1. The endpoint routes the request to `UploadMeetingAudio`.
2. A unique storage reference (`ref`) is constructed using `storage.buildRef`.
3. The raw file bytes are written to storage via `storage.put(ref, bytes, mimeType)`.
4. A database `AudioAsset` metadata record is created, saving the reference in `storageReference`.

### 3. Transcription Use Case
In [transcribe-audio.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/modules/transcription/application/transcribe-audio.ts):
```typescript
const result = await this.ctx.transcription.transcribe({
  audioRef: target.storageReference,
  mimeType: target.mimeType,
  correlationId
});
```
It loads the metadata record and passes the string reference `target.storageReference` to the transcription provider. **It does not read the raw bytes from storage.**

---

## SDK Contract & Verification Review

### 1. OpenAI SDK Submission Details
The `OpenAITranscriptionProvider` ([openai.ts](file:///c:/Users/rajaj/Projects/1_Conversa/src/infrastructure/providers/openai.ts)) makes the following call:
```typescript
const res = await this.client.audio.transcriptions.create(
  { file: input.audioRef as unknown as OpenAI.Chat.ChatCompletionCreateParams["messages"], model: this.model } as never,
  { timeout: this.timeoutMs },
);
```

### 2. Verification Checklist

* **Actual Audio Bytes Passed?**
  * **NO.** Only the storage reference path string (e.g. `"tenants/demo/workspaces/demo/media/<uuid>"`) is passed to the SDK.
* **Filename Provided?**
  * **NO.** The actual file name is not supplied, violating standard boundary form-data requirements for transcription endpoints.
* **MIME Type Passed?**
  * **NO.** `input.mimeType` is received by the adapter but is never passed to the OpenAI SDK call.
* **No Public Storage URL?**
  * **YES.** No public URL or storage access details are leaked to external APIs.
* **No Local Path Treated as File Content?**
  * **YES.** No local server file path is leaked.
* **No Browser-Supplied API Key?**
  * **YES.** The API key is resolved from server-side environment variables via the factory.

---

## Technical Audit Metrics & Constraints

* **Current Input Type**: `TranscribeInput` which contains `audioRef: string` (holding the reference string path), `mimeType: string`, and `correlationId: string`.
* **Conversion Mechanism**: **NONE.** To bypass compiler type-safety checks, the code uses unsafe casting: `input.audioRef as unknown as ...` and casts the configuration block `as never`.
* **SDK Contract Used**: OpenAI Node SDK `client.audio.transcriptions.create()`, which expects an `Uploadable` object (e.g. `File` or `fs.ReadStream`), but is fed a string. This will crash or fail at runtime in production.
* **Memory Implications**: Because bytes are never retrieved or loaded, heap memory footprint is low (~0MB). A correct remediation must retrieve the file into memory and instantiate a Hono/DOM `File` or `Blob` object, which may occupy up to 25MB of RAM per concurrent request.
* **Size Limits**: OpenAI has a hard 25MB limit on transcription payloads. The application does not check files against this limit before transcription.
* **Error Mapping**: Standard network or SDK errors are caught in a flat `try/catch` block and mapped to a generic `AppError` with code `PROVIDER_ERROR` and HTTP status `502`.
* **Timeout Behavior**: The request options pass `timeout: this.timeoutMs` directly to the OpenAI client.
* **Cleanup Behavior**: None. Since no temporary filesystem files are created, no cleanup functions are required.

---

## Verdict

* **Audited Status**: <span style="color:red">**FAIL**</span>
* **Rationale**: The OpenAI adapter is non-functional. It passes the database's internal storage path string directly to the OpenAI API instead of loading the audio bytes from the storage repository. This bypasses TypeScript checks using unsafe casting and will crash in production.
