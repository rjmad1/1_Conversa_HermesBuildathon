# Non-Functional Quality Gates

This document defines the quantitative gates and validation thresholds that the Conversa Audio-to-Governed-Action milestone must pass before deployment.

---

## Quality Gates Matrix

### 1. API Correctness
* **Gate**: Build compilation & verification.
  * **Target**: `0` eslint warnings or errors. (Confirmed requirement, `package.json` script: `eslint . --max-warnings=0`).
  * **Target**: `0` typecheck compilation errors. (Confirmed requirement, `tsc --noEmit`).
  * **Target**: `100%` of API error responses match the global error envelope shape. (Provisional target requiring architecture approval).

### 2. Build Stability
* **Gate**: Build run time.
  * **Target**: Production bundler execution completing in `< 120s`. (Provisional target requiring architecture approval).
  * **Target**: Production bundle size (js/css) under `< 500 KB` gzipped. (Provisional target requiring architecture approval).

### 3. Automated-Test Reliability
* **Gate**: Verification suite metrics.
  * **Target**: `100%` test pass rate. (Confirmed requirement).
  * **Target**: `>= 80%` TypeScript statement coverage. (Provisional target requiring architecture approval).
  * **Target**: `0` flaky test runs (no test fails intermittently under standard CI constraints). (Provisional target requiring architecture approval).

### 4. Accessibility (A11y)
* **Gate**: WCAG AA verification.
  * **Target**: `100%` of primary screens (Upload, Paste, Review/Approval) are fully keyboard-navigable. (Confirmed requirement, `docs/non-functional.md`).
  * **Target**: Minimum contrast ratio of `4.5:1` for all text elements. (Confirmed requirement).
  * **Target**: `0` webcam/camera prompt requests in the browser bundle. (Confirmed requirement, `docs/acceptance-criteria.md`).

### 5. Upload Resilience
* **Gate**: Boundary constraints.
  * **Target**: Rejection of uploads exceeding `10,485,760 bytes` (10 MB). (Confirmed requirement, `docs/media-validation.md`).
  * **Target**: Rejection of audio duration exceeding `7,200 seconds` (2 hours). (Confirmed requirement, `docs/media-validation.md`).
  * **Target**: Network timeout for file upload streams set to `120s`. (Provisional target requiring architecture approval).

### 6. AI-Provider Timeout Behavior
* **Gate**: Provider latency limits.
  * **Target**: Transcription API call timeout set to exactly `55,000 ms` (55 seconds). (Confirmed requirement, `src/shared/config/env.ts` default: `PROVIDER_TIMEOUT_MS`).
  * **Target**: Analysis GPT-4o API call timeout set to `30,000 ms` (30 seconds). (Provisional target requiring architecture approval).

### 7. Retry Bounds
* **Gate**: Automated backoff retries.
  * **Target**: Maximum retry count for transient provider API errors set to exactly `2` attempts. (Confirmed requirement, `src/shared/config/env.ts` default: `PROVIDER_MAX_RETRIES`).
  * **Target**: First retry backoff delay starts at exactly `1,000 ms`. (Provisional target requiring architecture approval).

### 8. Idempotency
* **Gate**: Ingestion and analysis deduplication.
  * **Target**: Duplicate audio upload (matching checksum and meeting) resolved in `< 250ms` from DB cache, writing `0` additional bytes to object store. (Provisional target requiring architecture approval).
  * **Target**: Repeated transcript analysis returns cached data in `< 100ms`. (Provisional target requiring architecture approval).

### 9. Concurrency
* **Gate**: Load controls.
  * **Target**: Maximum concurrent uploads per tenant restricted to `5` simultaneous operations. (Provisional target requiring architecture approval).
  * **Target**: Concurrently submitted analysis requests for the same transcript reject with HTTP `409` in `100%` of races. (Provisional target requiring architecture approval).

### 10. Tenant Isolation
* **Gate**: Isolation leak verification.
  * **Target**: `0` occurrences of cross-tenant data leaks during automated tenant-isolation test cases. (Confirmed requirement).
  * **Target**: `100%` of repo write and read endpoints covered by multi-tenant validation unit tests. (Provisional target requiring architecture approval).

### 11. Log Hygiene
* **Gate**: PII leakage verification.
  * **Target**: `0` occurrences of raw audio references, API keys, secrets, or transcripts in plain text stdout logs. (Confirmed requirement, `docs/non-functional.md`).
  * **Target**: `100%` of log outputs match structured JSON configurations. (Confirmed requirement).

### 12. Error Recovery
* **Gate**: Recoverable transaction state.
  * **Target**: `100%` of failed transcriptions leave the parent meeting in a recoverable state (`DRAFT` / `FAILED`) rather than locked in processing. (Confirmed requirement).
  * **Target**: Rollback of metadata registry takes `< 500ms` if R2 object write fails during upload. (Provisional target requiring architecture approval).

### 13. Health Checks
* **Gate**: Probes reliability.
  * **Target**: Liveness endpoint responds in `< 50 ms` under zero-load conditions. (Provisional target requiring architecture approval).
  * **Target**: Liveness endpoint performs `0` database queries or provider network calls. (Confirmed requirement).
  * **Target**: Readiness endpoint reports degradation in `< 500 ms` when persistence is unavailable. (Provisional target requiring architecture approval).

### 14. Audit Completeness
* **Gate**: Historical trail tracking.
  * **Target**: `100%` of meeting lifecycle state changes (Create, Upload, Transcribe, Analyze, Action Decision) write a matching audit log event. (Confirmed requirement).
  * **Target**: Correlation ID continuity tracked across `100%` of cascaded downstream calls. (Confirmed requirement).
