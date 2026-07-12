# Conversa Synthetic Audio Test Corpus Usage Guide

This directory contains the synthetic, deterministic, non-sensitive audio test fixtures designed to execute quality, security, and release assurance verification suites for the Conversa Audio-to-Governed-Action platform.

> [!WARNING]
> **Test Safety Warning**
> Intentionally malformed files (`truncated-header.wav`, `random-bytes.wav`, `empty-audio.wav`, `wrong-extension.mp3`) are provided for testing boundary failure conditions. They must never be deployed or used outside controlled automated test environments.

---

## Synthetic Data & Licensing Statement

All audio fixtures in this corpus are fully synthetic and generated using local system-native tools.
- **Speech Synthesis:** Generated via Microsoft SAPI (Windows Text-To-Speech) using standard generic voices ("Microsoft David Desktop" and "Microsoft Zira Desktop"). No real human voice cloning or proprietary voice prints were used.
- **Silence & Signals:** Programmatically synthesized using Python's standard library. No copyrighted, proprietary, or third-party audio downloads were incorporated.
- **Licensing:** These fixtures are released under the Creative Commons Zero (CC0 1.0 Universal) Public Domain Dedication.

---

## Fixture Inventory

### Clean Speech Fixtures
- `clean-actions.wav` / `clean-standard.wav`: Spoken dialogue from transcript `01-clear-actions.txt` using alternating voices.
- `missing-owner-date.wav`: Spoken speech from `02-missing-owners-and-dates.txt`.
- `no-actions.wav`: Spoken speech from `03-no-actions.txt`.
- `ambiguous-commitments.wav`: Spoken speech from `10-ambiguous-commitments.txt`.
- `high-risk-action.wav`: Spoken speech from `12-high-risk-action.txt`.

### Validation & Negative Scenarios
- `silence-5s.wav`: 5 seconds of silence.
- `silence-30s.wav`: 30 seconds of silence.
- `near-silence.wav`: Audio containing extremely low amplitude signal.
- `low-volume-speech.wav`: Synthesized speech at 5% volume level.
- `clipped-audio.wav`: Speech audio with 15x boost resulting in severe clipping.
- `background-noise.wav`: Spoken speech mixed with deterministic white noise (seed `12345`).
- `wrong-extension.mp3`: Valid WAV file saved with `.mp3` extension to verify container/MIME checks.
- `truncated-header.wav`: WAV container truncated to 20 bytes to verify corrupt file handling.
- `empty-audio.wav`: Zero-byte file to check empty file rejection.
- `random-bytes.wav`: 10 KB of deterministic random bytes (seed `98765`) to check non-audio rejection.
- `duplicate-clean-actions.wav`: Byte-for-byte duplicate of `clean-actions.wav` to test deduplication.

### Multi-Speaker Scenarios
- `two-speakers-sequential.wav`: Alternating David and Zira speech with no overlap.
- `two-speakers-overlap.wav` / `overlapping-speakers.wav`: David and Zira speaking simultaneously with a 2-4 second overlap.

### Duration Limits (Configured limit: 2 hours)
- `duration-under-limit.wav`: 5-second silence file (valid under-limit representative).
- `duration-at-limit.wav` (REPRESENTATIVE): 5-second silence representing the 2-hour limit (full size deferred to protect repository size).
- `duration-over-limit.wav` (REPRESENTATIVE): 5-second silence representing a duration exceeding the 2-hour limit.

---

## Supported Formats & Blocked Fixtures

Due to the absence of local MP3/M4A/MP4 conversion tools, all requested MP3, M4A, and MP4 fixtures (with the exception of `wrong-extension.mp3` which is a WAV renamed) are marked as **BLOCKED** from generation. 

Blocked files:
- `clean-standard.mp3`, `clean-standard.m4a`
- `silence-30s.mp3`
- `noisy-background.mp3`
- `corrupt-header.mp3`
- `oversized-file.mp3`
- `excessive-duration.m4a`
- `unsupported-video.mp4`
- `clean-actions.mp3`, `clean-actions.m4a`
- `missing-owner-date.mp3`, `missing-owner-date.m4a`
- `no-actions.mp3`, `no-actions.m4a`
- `ambiguous-commitments.mp3`, `ambiguous-commitments.m4a`
- `high-risk-action.mp3`, `high-risk-action.m4a`

---

## Checksum Verification

To verify that the fixtures have not been modified or corrupted, run the following SHA-256 checksum check:

```powershell
# Windows PowerShell
Get-Content .\checksums.sha256 | ForEach-Object {
    $parts = -split $_
    if ($parts.Length -eq 2) {
        $expectedHash = $parts[0]
        $file = $parts[1]
        $actualHash = (Get-FileHash -Path $file -Algorithm SHA256).Hash.ToLower()
        if ($actualHash -eq $expectedHash) {
            Write-Output "$file: OK"
        } else {
            Write-Error "$file: FAILED (Expected $expectedHash, got $actualHash)"
        }
    }
}
```

---

## Expected Regeneration Procedure

To regenerate the audio files programmatically:
1. Ensure the Python scripts and PowerShell SAPI utilities are available in the workspace.
2. Run the generator script:
   ```powershell
   python scratch/generate_fixtures.py
   ```
3. Run the metadata compiler script to update `fixture-catalogue.json` and `checksums.sha256`:
   ```powershell
   python scratch/compile_metadata.py
   ```

---

## Merge and Isolation Guidance

- **No Production Code Changed:** No application files, test files, config files, package manifests, or lockfiles have been modified.
- **Independent Cherry-Pickable:** All changes are strictly confined to `quality-artifacts/audio-governed-action/fixtures/generated-audio/`. This directory is completely self-contained and can be cherry-picked onto any branch.
- **Git Worktree Isolation:** Development was executed in the clean, isolated git branch `HERMES_THIRDGATE/synthetic-audio-fixtures`.
