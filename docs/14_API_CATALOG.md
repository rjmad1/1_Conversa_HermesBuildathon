# 14 — API Catalog

- **Platform Name**: Conversa API Engine
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🌐 Hono REST API & Convex Function Catalog

### 1. HTTP REST Endpoints (`api/server.ts`, `app/api/*`)

#### `GET /api/v1/health`
- **Description**: Returns real-time platform system status, database latency, and active module readiness.
- **Auth**: Public
- **Response**: `{ status: "ok", version: "0.3.0", timestamp: string }`

#### `POST /api/v1/meetings/process`
- **Description**: Submits raw audio recording or transcript for Phase 1–4 cognitive pipeline processing.
- **Auth**: Bearer Token / Session
- **Payload**: `{ meetingId: string, audioUrl?: string, transcriptText?: string, workspaceId: string }`
- **Response**: `{ status: "success", packageId: string, cryptographicManifest: Object }`

#### `POST /api/v1/integrations/hand-off`
- **Description**: Dispatches structured action item or decision to external target (Jira, Linear, GitHub, Azure DevOps, Slack).
- **Auth**: Bearer Token / Session
- **Payload**: `{ destination: "jira" | "linear" | "github" | "azure-devops" | "slack", actionId: string, title: string, description?: string }`
- **Response**: `{ status: "success", externalReferenceUrl: string }`

---

### 2. Convex Serverless Functions (`convex/*`)

* **`meetings:listMeetings`**: Reactive query listing workspace meetings with status and metadata.
* **`meetings:createMeeting`**: Mutation initializing new meeting record.
* **`knowledge:getKnowledgePackage`**: Reactive query fetching `ValidatedKnowledgePackage` by ID.
* **`graph:getWorkspaceGraph`**: Reactive query fetching graph nodes and edges with topological layout.
* **`search:searchWorkspace`**: Semantic vector and keyword search across historical decisions and tasks.
* **`views:getWorkspaceViews`**: Reactive query retrieving saved user view projections.
