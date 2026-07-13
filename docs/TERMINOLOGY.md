# Conversa — Domain Terminology & Glossary

---
### 📋 Document Metadata
- **Purpose**: Domain glossary defining business terms, technical acronyms, and platform-specific terminology.
- **Audience**: All team members, builders, and AI assistants.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Derived from core code directories and modules).
- **Evidence Used**: Module names, schema definitions, and agent coordinations.
- **Cross References**: See [PROJECT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/PROJECT.md), [AGENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/AGENTS.md).
- **Open Questions**: None.
- **Known Limitations**: Ephemeral DB locks limit verification of glossary terms in external systems.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Business & Domain Glossary

* **Tenant**: A logical customer boundary that isolates database collections, audio storage, and user credentials from other customers.
* **Workspace**: A subset of collaboration within a tenant (e.g. engineering team, sales department).
* **Meeting Agency**: The multi-agent crew that analyzes transcripts to extract decisions, risks, and proposed action items.
* **Specialist Agent**: An AI agent configured to perform a single extraction task (e.g. Action Specialist).
* **QA Reviewer**: An AI agent that validates specialist outputs against compliance rules and requests corrections.
* **Agent Handoff**: The structured data envelope passed between specialists containing meeting context and instructions.
* **Revision Loop**: The automated process of feeding QA corrections back to specialists to resolve extraction defects.
* **Escalation**: Transitioning an agency step to a manual review state when automated revision limits are exceeded.
* **Human-in-the-Loop (HITL)**: Gating AI proposals behind manual user approvals before publishing them to external tools.

---

## 2. Technical Abbreviations & Acronyms

* **RBAC**: Role-Based Access Control (Viewer, Approver, Admin).
* **BYOK**: Bring Your Own Key (Clients supply their OpenAI keys).
* **CSP**: Content-Security-Policy (Headers restricting resource execution).
* **HSTS**: HTTP Strict Transport Security.
* **D1 / R2**: Cloudflare's serverless SQLite database and Object Storage.
* **SRE**: Site Reliability Engineering.
* **CVE**: Common Vulnerabilities and Exposures.
