# Expected Validation Matrix

This matrix defines the expected behaviors, error codes, persistence, retryability, audit logs, and test layer suitability for each synthetic audio fixture in the corpus.

## Validation Matrix

| Fixture Filename | Upload Validation | Expected MIME | Expected Ext | Transcription Behavior | Expected Error Code | Retryable? | Persisted? | Audit Event? | Suitability / Test Layer |
|---|---|---|---|---|---|---|---|---|---|
| `clean-actions.wav` | **PASS** | `audio/wav` | `.wav` | Standard parsing of actions | N/A (Success) | N/A | Yes | Yes | Unit, Integration, E2E |
| `clean-standard.wav` | **PASS** | `audio/wav` | `.wav` | Standard parsing of actions | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `missing-owner-date.wav` | **PASS** | `audio/wav` | `.wav` | Parsing succeeds, owners/dates null | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `no-actions.wav` | **PASS** | `audio/wav` | `.wav` | Parsing succeeds, actions array empty | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `ambiguous-commitments.wav`| **PASS** | `audio/wav` | `.wav` | Parsing succeeds, actions array empty | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `high-risk-action.wav` | **PASS** | `audio/wav` | `.wav` | Parsing succeeds, high-risk flagged | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `silence-5s.wav` | **PASS** | `audio/wav` | `.wav` | Empty transcript | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `silence-30s.wav` | **PASS** | `audio/wav` | `.wav` | Empty transcript | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `near-silence.wav` | **PASS** | `audio/wav` | `.wav` | Empty transcript | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `low-volume-speech.wav` | **PASS** | `audio/wav` | `.wav` | Successful transcription | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `clipped-audio.wav` | **PASS** | `audio/wav` | `.wav` | Successful transcription with noise/distortion | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `background-noise.wav` | **PASS** | `audio/wav` | `.wav` | Successful transcription despite noise | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `wrong-extension.mp3` | **FAIL** | `audio/wav` | `.mp3` | Rejected before transcription | `MIME_TYPE_MISMATCH` | No | No | Yes (Reject) | Unit, Integration |
| `truncated-header.wav` | **FAIL** | `application/octet-stream` or `audio/wav` | `.wav` | Rejected before transcription | `MALFORMED_AUDIO` | No | No | Yes (Reject) | Unit, Integration |
| `empty-audio.wav` | **FAIL** | `application/x-empty` | `.wav` | Rejected before transcription | `EMPTY_AUDIO_FILE` | No | No | Yes (Reject) | Unit, Integration |
| `random-bytes.wav` | **FAIL** | `application/octet-stream` | `.wav` | Rejected before transcription | `MALFORMED_AUDIO` | No | No | Yes (Reject) | Unit, Integration |
| `duplicate-clean-actions.wav`| **FAIL** | `audio/wav` | `.wav` | Rejected before transcription (if checksum exists) | `DUPLICATE_FILE` | No | No | Yes (Reject) | Unit, Integration |
| `two-speakers-sequential.wav`| **PASS** | `audio/wav` | `.wav` | Separate segments created | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `two-speakers-overlap.wav` | **PASS** | `audio/wav` | `.wav` | Diarization splits segments | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `overlapping-speakers.wav`| **PASS** | `audio/wav` | `.wav` | Diarization splits segments | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `duration-under-limit.wav` | **PASS** | `audio/wav` | `.wav` | Empty transcript / simple tone | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `duration-at-limit.wav` | **PASS** | `audio/wav` | `.wav` | Success (boundary) | N/A (Success) | N/A | Yes | Yes | Unit, Integration |
| `duration-over-limit.wav` | **FAIL** | `audio/wav` | `.wav` | Rejected before transcription | `AUDIO_DURATION_EXCEEDED`| No | No | Yes (Reject) | Unit, Integration |

---

## Expected Errors and Ingestion Policies

The platform enforces the following policies on ingest:
- **Format Integrity:** Intentionally damaged headers (`truncated-header.wav`) or non-audio binary strings (`random-bytes.wav`) must trigger a `MALFORMED_AUDIO` error.
- **Empty Files:** Any upload with a size of 0 bytes (`empty-audio.wav`) must immediately trigger `EMPTY_AUDIO_FILE` and stop processing.
- **Extension/MIME Mismatches:** Files containing valid PCM data but having conflicting extensions (e.g. `wrong-extension.mp3`) must trigger a `MIME_TYPE_MISMATCH` validation error.
- **Duration Enforcement:** Any audio file that exceeds the configurable limit (7200 seconds / 2 hours) must trigger `AUDIO_DURATION_EXCEEDED`. (Note that `duration-over-limit.wav` is generated as a representative 5-second fixture to protect repository size, but tests should mock the duration metadata to trigger the error, or use a larger file stored externally).
- **Duplicate Prevention:** Uploading an identical checksum (`duplicate-clean-actions.wav` matching `clean-actions.wav`) should be caught by duplicate-detection logic and return a `DUPLICATE_FILE` response.
- **Unsupported Video:** Trying to ingest video content like `unsupported-video.mp4` should trigger `UNSUPPORTED_MEDIA_TYPE`.
