import { describe, it, expect, vi } from "vitest";
import { JiraFormatAdapter } from "../../src/modules/integrations/adapters/jira";
import { LinearFormatAdapter } from "../../src/modules/integrations/adapters/linear";
import { SlackFormatAdapter } from "../../src/modules/integrations/adapters/slack";
import { GitHubFormatAdapter } from "../../src/modules/integrations/adapters/github";
import { ConfidenceAutoDispatchEngine } from "../../src/modules/approvals/application/auto-dispatch";
import { AzureKeyVaultSecurityService } from "../../src/infrastructure/security/key-vault";
import { BidirectionalSyncEngine } from "../../src/modules/integrations/bidirectional-sync";
import { WorkspaceDecisionRAGEngine } from "../../src/modules/retrieval/vector-search";

describe("Section 13 Opportunity Backlog — Comprehensive Capabilities Suite", () => {
  describe("OPT-01: Jira REST v3 Adapter", () => {
    it("formats ADF description and REST v3 payload correctly", () => {
      const adapter = new JiraFormatAdapter();
      const payload = adapter.formatPayload({
        title: "Migrate Auth to Clerk SSO",
        description: "Implement tenant isolation and Clerk SSO OAuth migration.",
        ownerName: "Alex Architect",
        dueDate: "2026-08-15",
        projectKey: "CONV",
      });

      expect(payload.fields.project.key).toBe("CONV");
      expect(payload.fields.summary).toBe("Migrate Auth to Clerk SSO");
      expect(payload.fields.description.type).toBe("doc");
      expect(payload.fields.description.content).toHaveLength(2);
    });

    it("handles dispatch with simulated response when credentials missing", async () => {
      const adapter = new JiraFormatAdapter();
      const res = await adapter.dispatch({
        title: "Test Task",
        description: "Test description",
        projectKey: "TEST",
      });

      expect(res.success).toBe(true);
      expect(res.issueKey).toContain("TEST-");
      expect(res.url).toContain("jira.atlassian.com");
    });
  });

  describe("OPT-02: Linear GraphQL Adapter", () => {
    it("formats GraphQL issue create query and variables correctly", () => {
      const adapter = new LinearFormatAdapter();
      const { query, variables } = adapter.formatPayload({
        title: "Refactor Convex Schemas",
        description: "Consolidate view_overrides into view_definitions.",
        teamId: "ENG",
        priority: 1,
      });

      expect(query).toContain("mutation CreateLinearIssue");
      expect(variables.input.teamId).toBe("ENG");
      expect(variables.input.priority).toBe(1);
    });

    it("dispatches simulated Linear issue identifier when API key missing", async () => {
      const adapter = new LinearFormatAdapter();
      const res = await adapter.dispatch({
        title: "GraphQL Task",
        description: "Test description",
        teamId: "STARTUP",
      });

      expect(res.success).toBe(true);
      expect(res.issueIdentifier).toContain("CONV-");
      expect(res.url).toContain("linear.app");
    });
  });

  describe("OPT-03: Interactive Slack Gate", () => {
    it("formats Block Kit payload with interactive approval and rejection buttons", () => {
      const adapter = new SlackFormatAdapter();
      const blockKit = adapter.formatBlockKitPayload({
        actionId: "act-999",
        title: "Deploy Security Remediation",
        description: "Upgrade key vault encryption for OAuth tokens.",
        ownerName: "Sarah CISO",
        dueDate: "2026-08-01",
      });

      expect(blockKit.blocks).toHaveLength(4);
      expect(blockKit.blocks[0].type).toBe("header");
      expect(blockKit.blocks[3].type).toBe("actions");
      expect(blockKit.blocks[3].elements[0].text.text).toContain("Approve");
      expect(blockKit.blocks[3].elements[1].text.text).toContain("Reject");
    });
  });

  describe("OPT-06: GitHub Issues Adapter", () => {
    it("formats GitHub issue creation payload correctly", () => {
      const adapter = new GitHubFormatAdapter();
      const payload = adapter.formatPayload({
        title: "Fix Memory Leak in Audio Recorder",
        description: "Clean up MediaRecorder stream tracks on component unmount.",
        ownerName: "Dev Lead",
        labels: ["bug", "audio"],
      });

      expect(payload.title).toBe("Fix Memory Leak in Audio Recorder");
      expect(payload.labels).toContain("bug");
      expect(payload.body).toContain("Conversa Action Item Metadata");
    });
  });

  describe("OPT-07: Confidence Auto-Dispatch Engine", () => {
    it("auto-approves and dispatches action item when confidence meets threshold (>= 0.95)", async () => {
      const mockAction = {
        id: "act-high-conf",
        meetingId: "meet-101",
        description: "Refactor Database Indexing",
        status: "PROPOSED",
        confidence: 0.98,
        ownerName: "Alex",
        dueDate: "2026-08-10",
      };

      const mockCtx: any = {
        identity: { tenantId: "t1", workspaceId: "w1" },
        repos: {
          meetingAnalysis: {
            getAction: vi.fn().mockResolvedValue(mockAction),
            updateAction: vi.fn().mockResolvedValue(true),
          },
        },
        audit: { record: vi.fn().mockResolvedValue(true) },
      };

      const engine = new ConfidenceAutoDispatchEngine(mockCtx, { confidenceThreshold: 0.95 });
      const result = await engine.evaluateAndDispatch("act-high-conf");

      expect(result.autoDispatched).toBe(true);
      expect(result.confidenceScore).toBe(0.98);
      expect(mockAction.status).toBe("APPROVED");
      expect(mockCtx.audit.record).toHaveBeenCalled();
    });

    it("retains action in HITL review queue when confidence score is below threshold", async () => {
      const mockAction = {
        id: "act-med-conf",
        meetingId: "meet-101",
        description: "Consider Third Party Vendor",
        status: "PROPOSED",
        confidence: 0.82,
      };

      const mockCtx: any = {
        identity: { tenantId: "t1", workspaceId: "w1" },
        repos: {
          meetingAnalysis: {
            getAction: vi.fn().mockResolvedValue(mockAction),
          },
        },
      };

      const engine = new ConfidenceAutoDispatchEngine(mockCtx, { confidenceThreshold: 0.95 });
      const result = await engine.evaluateAndDispatch("act-med-conf");

      expect(result.autoDispatched).toBe(false);
      expect(result.confidenceScore).toBe(0.82);
      expect(mockAction.status).toBe("PROPOSED");
    });
  });

  describe("OPT-08: Azure Key Vault Security Service", () => {
    it("encrypts and decrypts integration credentials using AES-256-GCM", () => {
      const security = new AzureKeyVaultSecurityService("test-32-byte-master-secret-key!");
      const encrypted = security.encryptSecret("jira-api-token-secret-12345");

      expect(encrypted.ciphertext).not.toBe("jira-api-token-secret-12345");
      expect(encrypted.iv).toHaveLength(24);
      expect(encrypted.tag).toHaveLength(32);

      const decrypted = security.decryptSecret(encrypted);
      expect(decrypted).toBe("jira-api-token-secret-12345");
    });

    it("seals and unseals integration credential envelopes", () => {
      const security = new AzureKeyVaultSecurityService();
      const creds = {
        integrationId: "int-101",
        provider: "jira" as const,
        apiToken: "secret-token-abc",
        updatedAt: new Date().toISOString(),
      };

      const { payload, vaultRef } = security.secureCredentials(creds);
      expect(vaultRef).toBe("akv://jira/int-101");

      const unsealed = security.unsealCredentials(payload);
      expect(unsealed.apiToken).toBe("secret-token-abc");
      expect(unsealed.provider).toBe("jira");
    });
  });

  describe("OPT-09: Bidirectional Sync Engine", () => {
    it("processes inbound destination webhook and updates Conversa action status", async () => {
      const mockAction = {
        id: "act-sync-101",
        meetingId: "meet-101",
        description: "Deploy Auth Service",
        status: "APPROVED",
      };

      const mockCtx: any = {
        identity: { tenantId: "t1", workspaceId: "w1" },
        repos: {
          meetingAnalysis: {
            getAction: vi.fn().mockResolvedValue(mockAction),
            updateAction: vi.fn().mockResolvedValue(true),
          },
        },
        audit: { record: vi.fn().mockResolvedValue(true) },
      };

      const engine = new BidirectionalSyncEngine(mockCtx);
      const res = await engine.processDestinationWebhook(
        {
          provider: "jira",
          event: "jira:issue_updated",
          issueKeyOrId: "CONV-101",
          actionId: "act-sync-101",
          status: "COMPLETED",
        },
        "corr-sync-1"
      );

      expect(res.success).toBe(true);
      expect(res.actionId).toBe("act-sync-101");
      expect(mockCtx.repos.meetingAnalysis.updateAction).toHaveBeenCalled();
      expect(mockCtx.audit.record).toHaveBeenCalled();
    });
  });

  describe("OPT-10: Workspace Decision RAG Search Engine", () => {
    it("executes vector similarity search and context assembly across past decisions", async () => {
      const rag = new WorkspaceDecisionRAGEngine();
      const res = await rag.searchDecisions({
        tenantId: "t1",
        workspaceId: "w1",
        query: "Clerk SSO architecture decision",
        topK: 3,
        filterType: "DECISION",
      });

      expect(res.query).toBe("Clerk SSO architecture decision");
      expect(res.results.length).toBeGreaterThan(0);
      expect(res.results[0]!.type).toBe("DECISION");
      expect(res.contextSummary).toContain("Clerk SSO");
      expect(res.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
