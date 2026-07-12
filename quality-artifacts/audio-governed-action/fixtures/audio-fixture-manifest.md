# Audio Fixture Manifest

This manifest specifies the synthetic or redistributable binary audio files required to execute the verification suite for the Conversa Audio-to-Governed-Action platform.

> [!NOTE]
> No binary files are created in this release branch. This document acts as the configuration contract for generating or acquiring test fixtures in subsequent phases.

## Required Audio Fixtures

| Filename | Format | Duration | Approx Size | Sample Rate | Channels | Spoken Content Source Transcript | Condition Tested | Expected Outcome | Licensing Requirement |
|---|---|---|---|---|---|---|---|---|---|
| `clean-standard.mp3` | MP3 (`audio/mpeg`) | 15s | ~240 KB | 44.1 kHz | 1 (Mono) | Text from `01-clear-actions.txt` | Standard clean upload | `201 Created`, status `STORED`, transcribes successfully | Synthetic TTS (e.g. OpenAI TTS) |
| `clean-standard.wav` | WAV (`audio/wav`) | 15s | ~1.3 MB | 16.0 kHz | 1 (Mono) | Text from `01-clear-actions.txt` | WAV compatibility ingestion | `201 Created`, status `STORED`, transcribes successfully | Synthetic TTS |
| `clean-standard.m4a` | M4A (`audio/mp4`) | 15s | ~150 KB | 44.1 kHz | 1 (Mono) | Text from `01-clear-actions.txt` | M4A compatibility ingestion | `201 Created`, status `STORED`, transcribes successfully | Synthetic TTS |
| `silence-30s.mp3` | MP3 (`audio/mpeg`) | 30s | ~480 KB | 44.1 kHz | 2 (Stereo) | *No spoken words (pure silence)* | Empty speech upload | `201 Created` on ingestion; empty transcript or `TRANSCRIPTION_FAILED` downstream | Generated via Audacity / `ffmpeg` silent generator |
| `noisy-background.mp3` | MP3 (`audio/mpeg`) | 20s | ~320 KB | 44.1 kHz | 1 (Mono) | "We need to launch tomorrow. Priya owns the checklist." with heavy white noise overlay | Low signal-to-noise ratio resilience | `201 Created`, transcription succeeds despite noise | CC0 white noise + TTS merge |
| `overlapping-speakers.wav`| WAV (`audio/wav`) | 10s | ~880 KB | 16.0 kHz | 2 (Stereo) | Two speakers talking at the same time: "I will draft the RFC..." / "No, I will do it..." | Speaker overlap and diarization complexity | `201 Created`, segments created with speakers split or null | CC0 or synthetic double-TTS recording |
| `corrupt-header.mp3` | MP3 (`audio/mpeg`) | N/A | 50 KB | N/A | N/A | *Corrupt binary data* | Damaged container / codec parsing check | `400 Bad Request` with `VALIDATION_ERROR` or `MALFORMED_AUDIO` code | Intentionally zeroed-out header bytes via hex editor |
| `wrong-extension.mp3` | MP3 (`audio/mpeg` label) | 5s | ~440 KB | 16.0 kHz | 1 (Mono) | "Short test audio" (actual WAV file renamed to .mp3) | Extension/MIME consistency boundary check | `400 Bad Request` with `MIME_EXTENSION_MISMATCH` code | Synthetic TTS WAV file renamed |
| `oversized-file.mp3` | MP3 (`audio/mpeg`) | 120m | ~11.5 MB | 44.1 kHz | 2 (Stereo) | Long repetitive podcast banter | Configurable file size limit boundary | `400 Bad Request` with `FILE_TOO_LARGE` or `VALIDATION_ERROR` code | CC0 audiobook clip |
| `excessive-duration.m4a` | M4A (`audio/mp4`) | 125m | ~9.8 MB | 22.05 kHz | 1 (Mono) | High-compression long mono discussion | Duration limit check (limit 7200s / 2 hours) | `400 Bad Request` with `DURATION_EXCEEDED` or `VALIDATION_ERROR` code | CC0 audiobook clip compressed |
| `unsupported-video.mp4` | MP4 (`video/mp4`) | 5s | ~1.5 MB | 44.1 kHz | 2 (Stereo) | Visual slide presentation with backing music | Unsupported media block check | `415 Unsupported Media Type` with `UNSUPPORTED_MEDIA_TYPE` error code | CC0 video clip or synthesized video test pattern |
