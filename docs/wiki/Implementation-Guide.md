# Implementation Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This guide provides technical walk-through details of the Conversa implementation.

## Technical Frameworks
* **Backend REST API**: Hono router. Routes are defined in `src/app/meetings.ts`, `src/app/actions.ts`, and `src/app/audits.ts`.
* **Frontend SPA**: Serves the SPA frontend under `src/ui/`.
* **Testing**: Vitest runner under `tests/`.

## Core Logic Modules

1. **Media Ingestion & Validation**
   * Classifies and checks file uploads.
   * Rejects video files with HTTP 415.
   * Abstraction: `AudioStorageProvider` handles temporary memory buffers.
2. **AI Integration Adapter**
   * Uses OpenAI Whisper API for audio transcription.
   * Employs chat completion models for summary and action items extraction.
3. **Repository Layer**
   * Located under `src/infrastructure/repositories/in-memory.ts`.
   * Enforces logical isolation per tenant using `x-tenant-id` and `x-workspace-id` HTTP request headers.
4. **Console Log Scrubbing**
   * Handled by the `ConsoleLogger` class.
   * Performs recursive scanning of log payloads down to 10 nesting levels deep to redact API keys and tokens.
