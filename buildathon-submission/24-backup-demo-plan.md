# Backup Demo Plan

## Level A — Live Demo (preferred)
- Environment: Public Vercel build
- Path: Synthetic transcript submission
- Trigger to stay on A: app reachable + analysis response timely

## Level B — Local Demo
- Environment: local app with fake provider
- Trigger to switch: public app unstable or network issue
- Time impact: +30–60 seconds for context switch

## Level C — Static Evidence Demo
- Environment: screenshots + expected output + evidence docs
- Trigger to switch: runtime unavailability or API instability
- Assets needed:
  - `22-demo-transcript.md`
  - `23-demo-expected-output.md`
  - screenshots (pending from Antigravity)
  - `18-evidence-index.md`
- Time impact: minimal; narrative-only walkthrough

## Switching criteria
- >1 failed live request in demo window
- judge time-box pressure
- provider/network instability

## Narration for fallback
"We are switching to evidence-backed fallback mode. The same flow is documented and verified in tests/adversarial/smoke artifacts."
