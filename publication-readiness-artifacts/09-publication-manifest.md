# Phase 9 - Publication Manifest

This document classifies every file and folder in the Conversa repository for public release safety, providing clear instructions for the GitHub publication run.

## File Classification Directory

| File / Folder Path | Classification | Reason | Sanitization / Exclusions Action | Final Recommendation |
|:---|:---|:---|:---|:---|
| `src/` | **Publish** | Core production source code; contains no credentials. | None. | Safe to release. |
| `src/ui/` | **Publish** | SPA frontend code and assets; contains no key references. | None. | Safe to release. |
| `tests/` | **Publish** | Unit, integration, E2E, and adversarial test suites. | None. | Safe to release. |
| `docs/` | **Publish** | Technical documentation and architecture records. | Prepend the **Current-state notice** near the top of documents. | Safe to release with disclosures. |
| `quality-artifacts/` | **Publish** | Quality benchmarks, traceability, and evaluation rubrics. | None. | Safe to release. |
| `security-audit-artifacts/` | **Publish** | Audit findings, adversarial results, and closure details. | Ensure no real token strings are included in test logs. | Safe to release; demonstrates compliance diligence. |
| `publication-readiness-artifacts/` | **Publish** | Forensics and verification scorecard reports. | None. | Safe to release. |
| `.env.example` | **Publish** | Configuration environment variable template. | Verify all values are placeholders (e.g. `AUDIO_STORAGE_PREFIX=media`). | Safe to release. |
| `.gitignore` | **Publish** | Specifies files ignored by Git. | Ensure `node_modules`, `.env`, `dist`, and coverage directories are listed. | Safe to release. |
| `package.json` / `package-lock.json` | **Publish** | Dependency manifests. | None. | Safe to release. |
| `tsconfig.json` / `vite.config.ts` | **Publish** | Build configurations. | None. | Safe to release. |
| `.env` | **Do Not Publish** | Live environment credentials. | Add to `.gitignore`. Exclude from Git tracking. | **BLOCKED FROM RELEASE** |
| `node_modules/` | **Do Not Publish** | Third-party dependencies. | Excluded via `.gitignore`. | **BLOCKED FROM RELEASE** |
| `dist/` | **Do Not Publish** | Generated frontend build bundle. | Excluded via `.gitignore`. | **BLOCKED FROM RELEASE** |
| `.git/` | **Do Not Publish** | Local git history metadata database. | Excluded naturally by Git. | **BLOCKED FROM RELEASE** |
