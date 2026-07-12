# Evidence Index

## Code & Architecture
- `src/app/index.ts`
- `src/modules/*` (application/domain boundaries)
- `src/infrastructure/*`
- `src/shared/logging/logger.ts`
- `src/shared/security/redaction.ts`

## Test Suites
- `tests/unit/validation.spec.ts`
- `tests/unit/logger.spec.ts`
- `tests/unit/transcription-contract.spec.ts`
- `tests/integration/flow.spec.ts`
- `tests/integration/adversarial.spec.ts`
- `tests/integration/tenant-isolation.spec.ts`
- `tests/e2e/api.spec.ts`
- `tests/e2e/tenant-isolation.spec.ts`

## Security & Verification Artifacts
- `security-remediation-artifacts/continuation/03-validation-results.md`
- `security-remediation-artifacts/continuation/04-adversarial-results.md`
- `security-remediation-artifacts/continuation/05-smoke-test-results.md`
- `security-remediation-artifacts/continuation/07-final-verdict.md`

## Public-facing docs
- `README.md`
- `docs/FAQ.md`
- `docs/COMPLETION_SCORECARD.md`

## Public links (placeholders / external verification)
- GitHub Repo: `{{ANTIGRAVITY_GITHUB_URL}}`
- Wiki: `{{ANTIGRAVITY_WIKI_URL}}`
- Vercel Demo: `{{ANTIGRAVITY_VERCEL_URL}}`

## Key commits (to be confirmed against final branch history)
- Security remediation checkpoint: `788811f` (as provided in project facts)
- Current publication merge checkpoint: `a0bde80`

## Assets
- Screenshots: `buildathon-submission/assets/screenshots/` (pending)
- Diagrams: `buildathon-submission/assets/diagrams/`
- Evidence snippets: `buildathon-submission/assets/evidence/`
