# Conversa — Project Vision & Business Architecture

---
### 📋 Document Metadata
- **Purpose**: Establishes the business case, product vision, scope boundaries, stakeholders, and success criteria.
- **Audience**: Product managers, business analysts, executive sponsors, and engineering leads.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Derived directly from business design and product specifications).
- **Evidence Used**: Core project vision (`IDEA.md`), scope guidelines, and product specifications.
- **Cross References**: See [REQUIREMENTS.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/REQUIREMENTS.md) for specs, and [ROADMAP.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ROADMAP.md).
- **Open Questions**: Integration with corporate single sign-on (SSO) systems.
- **Known Limitations**: Ephemeral persistence hampers multi-tenant production trials.
- **Recommended Next Actions**: Align the product roadmap with core enterprise target metrics.
---

## 1. Business Vision & Problem Statement

### 1.1 Problem Statement
Modern enterprise communication produces vast amounts of linear data: hours of meeting recordings, lengthy transcripts, and dense documentation. Stakeholders, employees, and customers waste significant time searching through these static resources for answers to specific questions. Traditional search tools fail to capture the context, voice, and intent of the speakers, resulting in low engagement, poor corporate knowledge retention, and high operational costs.

### 1.2 The Conversa Solution
Conversa is a no-code, enterprise SaaS platform that turns meeting **audio** and **transcripts** into interactive, conversational AI experiences. It allows organizations to ingest meeting audio, extract structured insights, and publish them as interactive, asynchronous audio guides where users can ask questions and receive context-rich, human-like answers. This preserves the authenticity and nuance of human-to-human communication while scaling it to thousands of users simultaneously.

---

## 2. Project Goals & Objectives

### 2.1 Strategic Goals
* **Automate Knowledge Delivery**: Replace static corporate wikis and linear FAQ lists with dynamic, audio-driven conversational agents.
* **Reduce Technical Friction**: Enable non-technical users to build and run AI-based meeting analysis crews through a simple no-code control panel.
* **Preserve Corporate Trust**: Keep humans in the loop by gating AI-proposed actions, risks, and decisions behind manual approval workflows.

### 2.2 Functional Objectives
* **Ingestion and Validation**: Securely ingest, sanitize, and validate meeting audio (MP3, WAV, M4A) and synthetic pasted transcripts under strict tenant and workspace boundaries.
* **Orchestrate AI Crews**: Execute multi-agent analysis (Manager, Decision, Risk, and Action Specialists) to extract structured insights.
* **Traceability and Auditing**: Log every operational step, revision, cost estimation, and human approval in an immutable audit database.

---

## 3. Scope Boundaries & Non-Goals

### 3.1 In-Scope (Audio-First Slice)
* **Audio Uploads**: Ingestion of MP3, WAV, M4A up to 10MB.
* **Transcript Processing**: Passthrough path for pasted/imported transcripts.
* **AI Analysis**: Multi-agent coordination with automated QA reviewing, revision requests, and escalation hooks.
* **Human-in-the-Loop Gating**: Manual approval/rejection endpoints for proposed actions.
* **Audit Trail**: Step-by-step logs for compliance and operational tracking.

### 3.2 Out-of-Scope (Non-Goals)
* **Video Modality**: No video uploads, avatar creation, or interactive video playback in this release (see [ADR 0002](file:///c:/Users/rajaj/Projects/1_Conversa/docs/adr/0002-audio-first-media-scope.md)).
* **Live Streaming**: Real-time microphone capture or live websocket streaming is deferred to future releases.
* **External API Writebacks**: Automatic synchronization of actions to Jira, Slack, or Salesforce is not active in this vertical slice.

---

## 4. Key Stakeholders
* **Enterprise Authors / Creators**: Team leads, company executives, and corporate trainers who upload meetings.
* **Operations / Administrators**: DevOps engineers and IT managers who reset workspaces and manage tokens.
* **End Users / Consumers**: Employees and customers who query the published meeting insights.
* **AI Coding Assistants**: Developer agents executing code updates and technical documentation.

---

## 5. Success Metrics (KPIs)
1. **Precision & Recall Gates**: Decision, Risk, and Action extraction recall must remain $\ge 80\%$, with Action owner accuracy at $100\%$ and due date accuracy $\ge 95\%$ (as verified by `run-eval.ts`).
2. **Security Compliance**: Zero cross-tenant data leaks or unauthorized RBAC escalations (verified by security regression tests).
3. **Operational Latency**: Average agency coordination and QA review latency under $10$ seconds.
4. **Human-in-the-loop Rate**: $100\%$ of proposed actions undergo manual approval before system publication.
