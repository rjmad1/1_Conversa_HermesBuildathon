# Welcome to the Conversa Wiki

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Conversa is an **audio-first** meeting intelligence platform designed to extract action items, decisions, and summaries from meeting transcripts, putting a human-in-the-loop workflow on proposed actions.

---

## Quick Reference

* **GitHub Repository**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon`
* **Vercel Live Application**: `https://1-conversa-hermes-buildathon.vercel.app/`
* **Current Source Commit**: `788811f` (fix: close tenant isolation and runtime security audit findings)
* **Buildathon Status**: Stable snapshot. Verification checks pass.
* **Last Updated**: July 12, 2026

---

## Validation Summary

* **TypeScript Compilation**: PASS
* **Eslint Checks**: PASS
* **Vitest Suite**: 56/56 tests PASS
* **Adversarial Security Isolation Suite**: PASS
* **Log Redaction Scan**: PASS

---

## Stable Demo Path
Due to Vercel's serverless timeout limitations and the experimental nature of transcription wrappers, the **Pasted Transcript** pathway is the recommended, stable, and verified route for evaluating the Conversa MVP. 

---

## Key Limitations & Risks
* **In-memory Repository**: Data is volatile and does not survive restarts.
* **No Secure Authentication**: Tenant headers are caller-supplied and spoofable.
* See the full list in [Known Limitations and Risks](Known-Limitations-and-Risks.md).

---

## Security Disclosure
Please do not file public issues for security vulnerabilities. Review our [Security and Privacy](Security-and-Privacy.md) policy for reporting processes.

---

## Documentation Index & Navigation

* **Overview & Design**
  * [Project Overview](Project-Overview.md)
  * [Architecture](Architecture.md)
  * [Use Cases](Use-Cases.md)
  * [User Stories](User-Stories.md)
* **Guides**
  * [Getting Started](Getting-Started.md)
  * [User Guide](User-Guide.md)
  * [Admin Guide](Admin-Guide.md)
  * [Demo Guide](Demo-Guide.md)
* **Operations & Configuration**
  * [Deployment Guide](Deployment-Guide.md)
  * [Vercel Deployment](Vercel-Deployment.md)
  * [Configuration](Configuration.md)
  * [Troubleshooting](Troubleshooting.md)
  * [Frequently Asked Questions](Frequently-Asked-Questions.md)
* **API & Quality**
  * [API Reference](API-Reference.md)
  * [Testing and Quality](Testing-and-Quality.md)
  * [Security and Privacy](Security-and-Privacy.md)
* **Future**
  * [Roadmap](Roadmap.md)
  * [Glossary](Glossary.md)
