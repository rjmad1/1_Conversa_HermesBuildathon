# Synthetic Audio Fixtures Generation Plan

This document details the plan and configuration for the synthetic audio test fixtures created for the Conversa Audio-to-Governed-Action validation suite.

---

## 1. Fixtures Explicitly Required by the Manifest

The following fixtures are specified in [audio-fixture-manifest.md](../audio-fixture-manifest.md). Due to the lack of local MP3/M4A/MP4 conversion tools, MP3/M4A/MP4 files are marked as **BLOCKED** from generation, and WAV files are generated instead where possible.

| Fixture ID | Filename | Format | Duration Target | Sample Rate | Channels | Spoken Content Source Transcript | Purpose / Condition Tested | Expected Outcome | Generation Method | Required Tool | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `clean-standard-wav` | `clean-standard.wav` | WAV | 15s | 22.05 kHz | 1 | `01-clear-actions.txt` | Standard clean upload WAV compatibility | Ingestion success, transcribes successfully | Spoken turns synthesized via SAPI David/Zira, concatenated with 0.5s silence | PowerShell SAPI, Python | **GENERATED** |
| `overlapping-speakers` | `overlapping-speakers.wav` | WAV | 10s | 22.05 kHz | 1 | Custom (Two overlapping speakers) | Speaker overlap & diarization boundary | Ingestion success, segments created with split/null speakers | Overlapping PCM samples mixed in Python | PowerShell SAPI, Python | **GENERATED** |
| `wrong-extension` | `wrong-extension.mp3` | MP3 (WAV container) | 3s | 22.05 kHz | 1 | "Short test audio" | Inconsistent MIME/extension check | `400 Bad Request` with `MIME_EXTENSION_MISMATCH` or equivalent | Short spoken text synthesized to WAV, saved as `.mp3` | PowerShell SAPI | **GENERATED** |
| `clean-standard-mp3` | `clean-standard.mp3` | MP3 | 15s | 44.1 kHz | 1 | `01-clear-actions.txt` | Standard clean upload MP3 compatibility | Ingestion success, transcribes successfully | MP3 Encoder | `ffmpeg` | **BLOCKED** |
| `clean-standard-m4a` | `clean-standard.m4a` | M4A | 15s | 44.1 kHz | 1 | `01-clear-actions.txt` | Standard clean upload M4A compatibility | Ingestion success, transcribes successfully | M4A Encoder | `ffmpeg` | **BLOCKED** |
| `silence-30s-mp3` | `silence-30s.mp3` | MP3 | 30s | 44.1 kHz | 2 | None (silence) | Empty speech upload | Ingestion success, empty transcript | MP3 Encoder | `ffmpeg` | **BLOCKED** |
| `noisy-background-mp3` | `noisy-background.mp3` | MP3 | 20s | 44.1 kHz | 1 | "We need to launch tomorrow..." | Low SNR resilience | Ingestion success, transcribes successfully | MP3 Encoder | `ffmpeg` | **BLOCKED** |
| `corrupt-header-mp3` | `corrupt-header.mp3` | MP3 | N/A | N/A | N/A | Corrupt bytes | Damaged container / codec parsing check | `400 Bad Request` with `MALFORMED_AUDIO` | Hex edited headers | Hex Editor | **BLOCKED** |
| `oversized-file-mp3` | `oversized-file.mp3` | MP3 | 120m | 44.1 kHz | 2 | Repetitive banter | Configurable file size limit check | `400 Bad Request` with `FILE_TOO_LARGE` | MP3 Encoder | `ffmpeg` | **BLOCKED** |
| `excessive-duration-m4a` | `excessive-duration.m4a` | M4A | 125m | 22.05 kHz | 1 | Mono discussion | Duration limit check (limit 2 hours) | `400 Bad Request` with `DURATION_EXCEEDED` | M4A Encoder | `ffmpeg` | **BLOCKED** |
| `unsupported-video-mp4` | `unsupported-video.mp4` | MP4 | 5s | 44.1 kHz | 2 | Slide presentation with audio | Unsupported media block check | `415 Unsupported Media Type` | MP4 Video Encoder | `ffmpeg` | **BLOCKED** |

---

## 2. Additional Fixtures Introduced for Coverage

These additional fixtures expand the validation of speech analysis, negative scenarios, multiple-speaker handling, and duration limits.

| Fixture ID | Filename | Format | Duration Target | Sample Rate | Channels | Spoken Content Source Transcript | Purpose / Condition Tested | Expected Outcome | Generation Method | Required Tool | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `clean-actions` | `clean-actions.wav` | WAV | 15s | 22.05 kHz | 1 | `01-clear-actions.txt` | Clean standard text with action items | Ingestion success, transcribes successfully | Alternating SAPI voices Zira/David with 0.5s gaps | PowerShell SAPI, Python | **GENERATED** |
| `missing-owner-date` | `missing-owner-date.wav` | WAV | 15s | 22.05 kHz | 1 | `02-missing-owners-and-dates.txt` | Actions with missing metadata (owners/dates) | Ingestion success, parsed actions have null owner/date | SAPI David voice, concatenated with 0.5s gaps | PowerShell SAPI, Python | **GENERATED** |
| `no-actions` | `no-actions.wav` | WAV | 15s | 22.05 kHz | 1 | `03-no-actions.txt` | Audio with zero action items | Ingestion success, empty actions list | Alternating SAPI Zira/David voices | PowerShell SAPI, Python | **GENERATED** |
| `ambiguous-commitments` | `ambiguous-commitments.wav` | WAV | 15s | 22.05 kHz | 1 | `10-ambiguous-commitments.txt` | Non-committal brainstorming | Ingestion success, empty actions list | Alternating SAPI Zira/David voices | PowerShell SAPI, Python | **GENERATED** |
| `high-risk-action` | `high-risk-action.wav` | WAV | 15s | 22.05 kHz | 1 | `12-high-risk-action.txt` | Database purge and credential migration | Ingestion success, high risk actions flagged | Alternating SAPI Zira/David voices | PowerShell SAPI, Python | **GENERATED** |
| `silence-5s` | `silence-5s.wav` | WAV | 5s | 22.05 kHz | 1 | None | 5 seconds of silence | Ingestion success, empty transcript | Writing zero bytes in PCM format | Python | **GENERATED** |
| `silence-30s` | `silence-30s.wav` | WAV | 30s | 22.05 kHz | 1 | None | 30 seconds of silence | Ingestion success, empty transcript | Writing zero bytes in PCM format | Python | **GENERATED** |
| `near-silence` | `near-silence.wav` | WAV | 5s | 22.05 kHz | 1 | None | Extremely low amplitude background noise | Ingestion success, empty transcript | Random samples in `[-1, 1]` range | Python | **GENERATED** |
| `low-volume-speech` | `low-volume-speech.wav` | WAV | 15s | 22.05 kHz | 1 | `01-clear-actions.txt` | Intelligible speech below normal volume | Ingestion success, transcribes successfully | SAPI voices with synthesis volume set to 5 | PowerShell SAPI, Python | **GENERATED** |
| `clipped-audio` | `clipped-audio.wav` | WAV | 15s | 22.05 kHz | 1 | `01-clear-actions.txt` | Audio containing severe clipping | Ingestion success, transcribes successfully | Amplifying `clean-actions.wav` by 15x and clipping samples | Python | **GENERATED** |
| `background-noise` | `background-noise.wav` | WAV | 5s | 22.05 kHz | 1 | Custom (Heavy noise overlay) | Low signal-to-noise ratio speech | Ingestion success, transcribes successfully | SAPI voice speech mixed with deterministic white noise (seed `12345`) | PowerShell SAPI, Python | **GENERATED** |
| `truncated-header` | `truncated-header.wav` | WAV | N/A | N/A | N/A | None | Intentionally malformed WAV header | `400 Bad Request` with `MALFORMED_AUDIO` | Truncate standard 1s silence file to first 20 bytes | Python | **GENERATED** |
| `empty-audio` | `empty-audio.wav` | WAV | N/A | N/A | N/A | None | Zero-byte empty file check | `400 Bad Request` with `EMPTY_AUDIO_FILE` | Empty file write | Python | **GENERATED** |
| `random-bytes` | `random-bytes.wav` | WAV | N/A | N/A | N/A | None | Non-audio byte sequence | `400 Bad Request` with `MALFORMED_AUDIO` | Deterministic random bytes write (seed `98765`, 10 KB) | Python | **GENERATED** |
| `duplicate-clean-actions` | `duplicate-clean-actions.wav` | WAV | 15s | 22.05 kHz | 1 | `01-clear-actions.txt` | Exact byte copy of clean-actions | Duplicate detection block | Byte-for-byte file copy | OS Copy, Python | **GENERATED** |
| `two-speakers-sequential` | `two-speakers-sequential.wav` | WAV | 10s | 22.05 kHz | 1 | Custom (Two sequential speakers) | Distinguishable voices without overlap | Ingestion success, separate segments created | SAPI David followed by Zira with 0.7s silence | PowerShell SAPI, Python | **GENERATED** |
| `two-speakers-overlap` | `two-speakers-overlap.wav` | WAV | 10s | 22.05 kHz | 1 | Custom (Two overlapping speakers) | Distinguishable voices with overlap | Ingestion success, diarization splits segments | Mix David and Zira PCM with 1.5s offset and clipping protection | PowerShell SAPI, Python | **GENERATED** |
| `duration-under-limit` | `duration-under-limit.wav` | WAV | 5s | 22.05 kHz | 1 | None | Duration under the 2-hour limit check | Ingestion success | Writing 5 seconds of silence | Python | **GENERATED** |
| `duration-at-limit` | `duration-at-limit.wav` | WAV | 5s (Rep.) | 22.05 kHz | 1 | None | Duration at the 2-hour limit boundary | `400 Bad Request` with `DURATION_EXCEEDED` or success (boundary) | **REPRESENTATIVE** 5s silence (Full 2-hour file is deferred due to repo limits) | Python | **GENERATED** |
| `duration-over-limit` | `duration-over-limit.wav` | WAV | 5s (Rep.) | 22.05 kHz | 1 | None | Duration over the 2-hour limit boundary | `400 Bad Request` with `DURATION_EXCEEDED` | **REPRESENTATIVE** 5s silence (Full 2-hour-5-sec file is deferred due to repo limits) | Python | **GENERATED** |

---

## 3. Blocked Fixtures (Missing Formats)

The following fixtures are blocked due to missing system tools (MP3/M4A/MP4 encoders).

- `clean-standard.mp3`
- `clean-standard.m4a`
- `silence-30s.mp3`
- `noisy-background.mp3`
- `corrupt-header.mp3`
- `oversized-file.mp3`
- `excessive-duration.m4a`
- `unsupported-video.mp4`
- `clean-actions.mp3`
- `clean-actions.m4a`
- `missing-owner-date.mp3`
- `missing-owner-date.m4a`
- `no-actions.mp3`
- `no-actions.m4a`
- `ambiguous-commitments.mp3`
- `ambiguous-commitments.m4a`
- `high-risk-action.mp3`
- `high-risk-action.m4a`
