# 11 — Known Limitations

- **Platform Name**: Conversa Platform
- **Repository Root**: `c:\Users\rajaj\Projects\1_Conversa`
- **Last Synchronized**: 2026-07-23T05:10:00+05:30

---

## 🛑 Platform Boundary Conditions & Limitations

1. **Third-Party Connector Credentials**:
   * *Limitation*: When optional external API tokens (e.g., `JIRA_API_TOKEN`, `LINEAR_API_KEY`, `GITHUB_TOKEN`, `AZURE_DEVOPS_PAT`, `SLACK_WEBHOOK_URL`) are omitted from `.env.local`, the hand-off connectors emit warning logs and return simulated JSON payloads.
   * *Workaround*: Supply valid enterprise API tokens in `.env.local` for live dispatching to remote services.

2. **Audio File Payload Size**:
   * *Limitation*: Direct HTTP upload payloads are currently capped at 100MB per audio file.
   * *Workaround*: Larger recordings (> 100MB) must be chunked or streamed via signed direct S3/Convex storage URLs.

3. **Graph Topology Node Limit**:
   * *Limitation*: Real-time living workspace visual renderers are optimized for workspaces containing up to 5,000 active nodes.
   * *Workaround*: Workspaces with > 5,000 nodes utilize paginated subgraph projections (`convex/views.ts`).

4. **Multi-Platform Ambient Join Bot Headless Dependencies**:
   * *Limitation*: Native headless browser instance spawning for Zoom/Teams recording requires system Playwright browser binaries (`chromium`).
   * *Fallback*: Synthetic transcript ingestion is available when headless browser binaries are absent.
