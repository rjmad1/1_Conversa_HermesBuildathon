# 15 — Data Model

- **Platform Name**: Conversa Data Engine
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🗄️ Domain Entities & Convex Database Schema (`convex/schema.ts`)

```
               ┌───────────────────────┐
               │        Meeting        │
               │  (meetings table)     │
               └───────────┬───────────┘
                           │ 1:N
                           ▼
               ┌───────────────────────┐
               │     ExtractedFact     │
               │ (extractedFacts table)│
               └───────────┬───────────┘
                           │ N:1 Consensus
                           ▼
               ┌───────────────────────┐
               │ KnowledgePackage      │
               │(knowledgePackages tbl)│
               └───────────┬───────────┘
                           │ 1:N Projection
                           ▼
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│    GraphNode    │ ──────1:N──────►│    GraphEdge    │
│(graphNodes tbl) │                 │(graphEdges tbl) │
└─────────────────┘                 └─────────────────┘
```

---

## 📋 Entity Descriptions

### 1. `meetings` Table
* `workspaceId` (string, indexed)
* `title` (string)
* `status` ("pending" | "processing" | "completed" | "failed")
* `audioUrl` (optional string)
* `transcript` (optional string)
* `createdAt` (number)

### 2. `extractedFacts` Table
* `meetingId` (string, indexed)
* `agentType` ("action" | "decision" | "risk" | "diarization")
* `rawContent` (string)
* `confidenceScore` (number)
* `lineReferences` (array of numbers)

### 3. `knowledgePackages` Table
* `meetingId` (string, indexed)
* `workspaceId` (string, indexed)
* `validatedActions` (array of ActionItems)
* `validatedDecisions` (array of DecisionItems)
* `validatedRisks` (array of RiskItems)
* `privacyLevel` ("Public" | "Internal" | "Confidential" | "Restricted" | "Regulated")
* `lineageManifest` (`{ semanticHash, contentHash, provenanceHash }`)

### 4. `graphNodes` Table
* `workspaceId` (string, indexed)
* `nodeType` ("Task" | "Decision" | "Risk" | "Meeting" | "Document")
* `label` (string)
* `properties` (JSON object)

### 5. `graphEdges` Table
* `workspaceId` (string, indexed)
* `sourceNodeId` (string, indexed)
* `targetNodeId` (string, indexed)
* `relationshipType` ("DependsOn" | "ExtractedFrom" | "References")
