# Conversa User Stories

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document registers the user stories, acceptance criteria, and active implementation evidence.

---

## US-101 — Pasted Transcript Ingestion

As a Product Manager,  
I want to paste a raw text meeting transcript into the application,  
so that I can extract action items without having to upload audio files.

### Acceptance Criteria:
* **Given** a raw text transcript is pasted into the UI input area,
* **When** I click the "Analyze Transcript" button,
* **Then** the Hono server parses the transcript and returns a meeting analysis JSON payload.

### Implementation Status:
* **Implemented**

### Evidence:
* **Route handler**: `src/app/meetings.ts`
* **UI form input**: `src/ui/index.html`
* **Unit tests**: `tests/unit/validator.spec.ts`

---

## US-102 — Human-in-the-Loop Action Approval

As a Team Lead,  
I want to manually approve or reject proposed action items,  
so that I can prevent incorrect or redundant tasks from being created.

### Acceptance Criteria:
* **Given** a list of proposed action items is displayed in the UI,
* **When** I click "Approve" on an action item,
* **Then** its status transitions to `APPROVED` in the database and audit trail.

### Implementation Status:
* **Implemented**

### Evidence:
* **Domain logic**: `src/modules/actions/use-cases.ts`
* **Hono handler**: `src/app/actions.ts`
* **E2E tests**: `tests/e2e/workflow.spec.ts`

---

## US-103 — Tenant Isolation Enforcement

As an Enterprise Administrator,  
I want the application to enforce strict separation between tenant contexts,  
so that users from one tenant cannot view or modify meetings from another.

### Acceptance Criteria:
* **Given** a request is sent to the backend with tenant headers,
* **When** the repositories fetch or update data,
* **Then** they only query items that match the specified tenant and workspace identifiers.

### Implementation Status:
* **Implemented**

### Evidence:
* **Repository scoping**: `src/infrastructure/repositories/in-memory.ts`
* **Security middleware**: `src/shared/auth-middleware.ts`
* **Adversarial tests**: `tests/integration/adversarial.spec.ts`

---

## US-104 — Log Scrubbing and Redaction

As a Security Officer,  
I want all application logs to be redacted of sensitive keys,  
so that API keys, tokens, and audio binaries do not leak into stdout/stderr.

### Acceptance Criteria:
* **Given** a logging event contains sensitive keys (e.g. `secret`, `token`, `audio`),
* **When** the logger writes to the console sink,
* **Then** the sensitive values are recursively replaced with `[REDACTED]`.

### Implementation Status:
* **Implemented**

### Evidence:
* **Logger component**: `src/shared/logger.ts`
* **Redaction tests**: `tests/unit/logger.spec.ts`

---

## US-105 — Audio Format Validation

As an Engineering Lead,  
I want the system to reject video and unsupported audio formats,  
so that ingestion resources are not wasted on incompatible media.

### Acceptance Criteria:
* **Given** a user uploads a video file (e.g. `.mp4`),
* **When** the backend validates the file headers,
* **Then** the request is rejected with `HTTP 415 Unsupported Media Type`.

### Implementation Status:
* **Implemented**

### Evidence:
* **Validation logic**: `src/modules/media/validator.ts`
* **Integration tests**: `tests/integration/validation.spec.ts`
