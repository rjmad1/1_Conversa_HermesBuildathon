# Conversa — UX / Design (Audio-First)

**Author role:** UX Director
**Goal:** The primary flow must be audio- and transcript-centric. No camera/video affordances anywhere.

## 1. Primary Flow (happy path)

1. **Input choice:** Two clear cards — "Upload audio" and "Paste transcript".
2. **Upload audio card:**
   - Drag-and-drop + file picker.
   - `accept="audio/mpeg,audio/wav,audio/mp4"`.
   - Guidance text: "Supported: MP3, WAV, M4A. Max 10 MB."
   - Selected file name + size shown.
   - **Upload progress bar** (0–100%).
   - On success → moves to transcription.
3. **Paste transcript card:**
   - Textarea, char count, min 10 chars.
   - "Clear" + "Paste from clipboard".
4. **Transcription progress** (audio path only): spinner + "Transcribing audio…".
5. **Processing failure state:** clear error + **Retry** button.
6. **Transcript review:** collapsible transcript; user can correct before analysis.
7. **Meeting analysis:** proposed actions list (description, owner, due, priority badge).
8. **Proposed-action approval/rejection:** per-item Approve / Reject; summary of pending vs approved.

## 2. Components (audio-first)

- `AudioUpload.tsx` (was `FileUpload.tsx`): audio only; no camera.
- `TranscriptInput.tsx`: paste path.
- `TranscriptionProgress.tsx`.
- `ActionItemsDisplay.tsx`: results + download JSON.
- `ApiKeyInput.tsx`: BYOK (unchanged).
- `ErrorState.tsx`: failure + retry.

## 3. REMOVED (must not appear)

- Camera controls, video preview, video thumbnails, video player, video timeline.
- Webcam permission prompts.
- Video-specific icons/labels (use mic/audio-wave/upload icons).

## 4. Microcopy (consistent audio language)

- "Upload meeting audio" not "add media".
- "We support MP3, WAV, and M4A audio files."
- Error on video: "Only audio files are supported (MP3, WAV, M4A)."

## 5. Accessibility

- Keyboard operable; ARIA on progress/errors; visible focus; alt text for icons; reduced-motion friendly.
- No camera prompt = fewer permission friction points.

## 6. Open Design Decisions

- Single-page flow (current plan) vs stepper. Keep single-page for MVP speed; show step indicator (Input → Transcribe → Analyze → Results).
- Empty/error states must be first-class, not afterthoughts (mvp judges check retry paths).
