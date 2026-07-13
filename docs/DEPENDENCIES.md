# Conversa — External Dependencies & Security Analysis

---
### 📋 Document Metadata
- **Purpose**: Catalogs all external dependencies, libraries, versions, purposes, risks, and maintenance guidelines.
- **Audience**: Platform engineers, DevOps, and security auditors.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Directly parsed from active `package.json` file in workspace root).
- **Evidence Used**: Core `package.json` dependencies declaration.
- **Cross References**: See [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md), [DEPLOYMENT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEPLOYMENT.md).
- **Open Questions**: Rotation policy for static Bearer tokens.
- **Known Limitations**: ephemerality of in-memory data.
- **Recommended Next Actions**: Enforce TLS and HTTPS verification at deployment gateway.
---

## 1. Production Dependencies

| Library Name | Version | Purpose / Scope | Security Concerns | Upgrade / Replacement Candidates |
| --- | --- | --- | --- | --- |
| **hono** | `^4.6.0` | Core REST router, middleware framing. | None. Standard framework. | Keep updated with latest minor releases. |
| **@hono/node-server** | `^2.0.8` | Serves Hono app on Node runtime. | None. | Upgrade to native Cloudflare Workers bindings. |
| **openai** | `^4.67.0` | Client to invoke Whisper and GPT-4o APIs. | API Key leakage in logs/client. BYOK security constraints active. | Swappable with local LLM interfaces (Ollama). |
| **zod** | `^3.23.8` | Data schema validation and HTTP body checks. | Denial of Service via complex schema parsing. | Standard validation. Keep updated. |

---

## 2. Development & Testing Dependencies

| Library Name | Version | Purpose / Scope | Security Concerns |
| --- | --- | --- | --- |
| **typescript** | `^5.7.2` | Strong type-compilation checks. | Build-time performance bottlenecks. |
| **vite** | `^6.0.0` | Bundler and dev server. | Dev server vulnerability to local hijacking. |
| **vitest** | `^2.1.8` | Unit, integration, E2E test runner. | Test execution injections. |
| **eslint** | `^9.17.0` | Code styling and quality auditing. | Package configuration injections. |

---

## 3. Dependency Security Recommendations
1. **BYOK Security Gate**: The OpenAI API key must never be logged. Production configurations must read it from server-side environment parameters only.
2. **NPM Audits**: Integrate `npm audit --audit-level=high` checks inside the CI pipeline (`security-ci.yml`) to fail builds if high/critical CVEs are present.
3. **Pin Dependency Versions**: Pin dependencies in production builds using `package-lock.json` to prevent supply chain modifications during automated build cycles.
