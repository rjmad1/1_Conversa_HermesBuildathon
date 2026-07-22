# Glossary

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Core terms and definitions:

* **Audio-First**: A product scope prioritizing meeting audio and transcript ingestion, explicitly excluding video recording or playback in this release.
* **BYOK (Bring Your Own Key)**: A credential model where the client provides their OpenAI API key in the UI session. The server never saves this key.
* **BOLA (Broken Object Level Authorization)**: A security vulnerability where users can access resources of other tenants by guessing or spoofing identifiers.
* **Hono**: The fast, lightweight web router framework powering the Conversa backend.
* **Vite**: The frontend compiler and development environment hosting the SPA client.
* **Tenant**: An organization or group scoping a separate business instance of Conversa.
* **Workspace**: A sub-partition of a tenant (e.g. a specific team or project).
