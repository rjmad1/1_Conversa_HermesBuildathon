# Security and Privacy

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document details the security mechanisms implemented to protect tenant data and log confidentiality in the Conversa codebase.

## 1. Multi-Tenancy Scoping (BOLA Mitigation)

To prevent Broken Object-Level Authorization (BOLA), every repository method filters records using scoping parameters resolved from the actor context:
* **Meeting Isolation**: Accessing meetings (`InMemoryMeetingRepo.get`) checks both the requesting tenant and workspace IDs.
* **Analysis Scoping**: Analyses and action-item updates are matched against the parent meeting record, which is validated against the requester's scopes.
* **Audit Trail Scoping**: Querying audit events performs meeting ownership checks, throwing a `MEETING_NOT_FOUND` (404) exception on unauthorized attempts.

> [!WARNING]
> **No Authentication**: Scoping parameters are resolved directly from request headers. This is a critical security vulnerability for production; these headers must be validated via an API gateway or token parser.

## 2. Deep Recursive Redaction

All metadata objects passed to the logging utility are processed via the `redact` method in `src/shared/security/redaction.ts`:
* **Recursive Scanning**: Scans nested objects, arrays, and properties for sensitive patterns (e.g. keys containing `key`, `secret`, `token`, `password`, `transcript`, `audio`).
* **Circular Reference Protection**: Uses a `WeakSet` to track visited nodes and outputs `[CIRCULAR]` on cycle detection, preventing stack overflow failures.
* **Depth Limitation**: Enforces a max depth of 10 levels, replacing deeper levels with `[MAX_DEPTH_REACHED]`.
* **Immutability**: Preserves the original log metadata object, preventing side effects in active threads.
