# Frequently Asked Questions

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

## General Questions

### What is Conversa?
Conversa is an **audio-first** meeting intelligence platform. It ingests meeting audio and transcripts, extracts summaries, risks, decisions, and action items, and processes them through an approval-gated human-in-the-loop workflow.

### What problem does it solve?
It prevents meeting follow-up tasks from being lost by automatically capturing action items, assigning owners, establishing due dates, routing them to target systems of record, and requiring manual human approval before execution.

### Is it production-ready?
No. The release classification is: **Experimental MVP snapshot — not production-ready.** It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

### Can it process confidential meetings?
No. The codebase runs in an experimental environment, lacks secure authentication, and sends transcript data to public AI API endpoints (OpenAI BYOK). Do not use real or confidential meeting data.

### Is tenant isolation implemented?
Yes. Tenant isolation is logically enforced in the repository layer by checking tenant/workspace scopes. Regression tests verifying tenant boundary isolation compile and pass.

### Which security defects were remediated?
The security remediation milestone (completed at commit `788811f`) closed vulnerabilities related to tenant isolation in route handlers and repositories, implemented console log scrubbing, and added recursive JSON log redaction up to depth 10.

### What authentication exists?
No production-grade authentication exists. Scoping is determined by caller-supplied `x-tenant-id` and `x-workspace-id` HTTP headers, which are unauthenticated and spoofable.

### Is real audio transcription available?
Yes, but it is experimental. The backend supports transcription via OpenAI Whisper, but due to timeout limitations, the stable, recommended path for the demo is the **Pasted Transcript** pathway.

### Which integrations are implemented?
The core data repository and workflow approval pipelines are implemented. Mocks are in place for Jira, Slack, and Salesforce integrations.

### Which integrations are planned?
Full live synchronization webhooks for Jira, Slack, and Salesforce are in the product roadmap.

### Is Convex active?
No. Convex is designed for future state management but is currently inactive.

### Is Cloudflare active?
No. Cloudflare R2 is designed for future object storage but is currently inactive; all files are stored in volatile memory.

### Why is Vercel used?
Vercel is used to host the prototype deployment branch, exposing the Hono backend as API routes and serving the Vite Single Page Application.

### What is HERMES?
HERMES is the core engineering group/platform defining the Conversa codebase architecture and requirements.

### What was Antigravity used for?
Antigravity is the AI engineering assistant used for codebase auditing, security remediation, verification test suites creation, and documentation packaging.

### Where are limitations documented?
Limitations are documented in the repository under `docs/KNOWN_LIMITATIONS.md` and in the Wiki under [Known Limitations and Risks](Known-Limitations-and-Risks.md).

### How are vulnerabilities reported?
Do not open GitHub issues. Submit report details privately to the project administrator or email `rajaj@example.com`. See [Security and Privacy](Security-and-Privacy.md) for details.

### Where is the live demo?
The live demo is hosted at:
```text
https://1-conversa-hermes.vercel.app/
```
