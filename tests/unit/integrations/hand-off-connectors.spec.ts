import { describe, it, expect } from "vitest";
import { JiraFormatAdapter } from "../../../src/modules/integrations/adapters/jira";
import { LinearFormatAdapter } from "../../../src/modules/integrations/adapters/linear";
import { GitHubFormatAdapter } from "../../../src/modules/integrations/adapters/github";
import { AzureDevOpsFormatAdapter } from "../../../src/modules/integrations/adapters/azure-devops";
import { SlackFormatAdapter } from "../../../src/modules/integrations/adapters/slack";
import { HandOffDispatcher } from "../../../src/modules/integrations/hand-off-dispatcher";

describe("Native Hand-Off Format Adapters & Dispatcher", () => {
  const sampleAction = {
    id: "action-101",
    meetingTitle: "Sprint Architecture Sync",
    title: "Deploy Auth Microservice",
    description: "Implement OAuth JWT verification and rate limiting on API gateway.",
    ownerName: "Alice Smith",
    dueDate: "2026-08-01",
    lineageHash: "abc123def456sha256lineage",
  };

  describe("JiraFormatAdapter", () => {
    it("generates valid Atlassian Document Format (ADF) description blocks", () => {
      const adapter = new JiraFormatAdapter();
      const payload = adapter.formatPayload({
        title: sampleAction.title,
        description: sampleAction.description,
        ownerName: sampleAction.ownerName,
        dueDate: sampleAction.dueDate,
        projectKey: "PROJ",
      });

      expect(payload.fields.project.key).toBe("PROJ");
      expect(payload.fields.summary).toBe(sampleAction.title);
      expect(payload.fields.issuetype.name).toBe("Task");
      expect(payload.fields.description.type).toBe("doc");
      expect(payload.fields.description.version).toBe(1);
      expect(payload.fields.description.content).toHaveLength(2);
    });

    it("dispatches simulated Jira issue creation when unconfigured", async () => {
      const adapter = new JiraFormatAdapter();
      const res = await adapter.dispatch({
        title: sampleAction.title,
        description: sampleAction.description,
        projectKey: "CONV",
      });

      expect(res.success).toBe(true);
      expect(res.issueKey).toMatch(/^CONV-\d+$/);
      expect(res.url).toContain("https://jira.atlassian.com/browse/CONV-");
    });
  });

  describe("LinearFormatAdapter", () => {
    it("builds valid Linear GraphQL mutation queries and variables", () => {
      const adapter = new LinearFormatAdapter();
      const { query, variables } = adapter.formatPayload({
        title: sampleAction.title,
        description: sampleAction.description,
        ownerName: sampleAction.ownerName,
        teamId: "TEAM-ENG",
      });

      expect(query).toContain("mutation CreateLinearIssue");
      expect(variables.input.teamId).toBe("TEAM-ENG");
      expect(variables.input.title).toBe(sampleAction.title);
      expect(variables.input.description).toContain(sampleAction.description);
    });

    it("dispatches simulated Linear issue creation when unconfigured", async () => {
      const adapter = new LinearFormatAdapter();
      const res = await adapter.dispatch({
        title: sampleAction.title,
        description: sampleAction.description,
      });

      expect(res.success).toBe(true);
      expect(res.issueIdentifier).toMatch(/^CONV-\d+$/);
      expect(res.url).toContain("https://linear.app/conversa/issue/");
    });
  });

  describe("GitHubFormatAdapter", () => {
    it("formats GitHub REST issue payload with markdown metadata", () => {
      const adapter = new GitHubFormatAdapter();
      const payload = adapter.formatPayload({
        title: sampleAction.title,
        description: sampleAction.description,
        ownerName: sampleAction.ownerName,
        dueDate: sampleAction.dueDate,
      });

      expect(payload.title).toBe(sampleAction.title);
      expect(payload.body).toContain("Conversa Action Item Metadata");
      expect(payload.labels).toContain("conversa-action");
    });

    it("dispatches simulated GitHub issue creation", async () => {
      const adapter = new GitHubFormatAdapter();
      const res = await adapter.dispatch({
        title: sampleAction.title,
        description: sampleAction.description,
        owner: "rjmad1",
        repo: "1_Conversa",
      });

      expect(res.success).toBe(true);
      expect(typeof res.issueNumber).toBe("number");
      expect(res.url).toContain("https://github.com/rjmad1/1_Conversa/issues/");
    });
  });

  describe("AzureDevOpsFormatAdapter", () => {
    it("formats Azure DevOps JSON Patch operations array", () => {
      const adapter = new AzureDevOpsFormatAdapter();
      const patch = adapter.formatPayload({
        title: sampleAction.title,
        description: sampleAction.description,
        ownerName: sampleAction.ownerName,
        areaPath: "Conversa\\Backend",
      });

      expect(Array.isArray(patch)).toBe(true);
      const titleOp = patch.find((p) => p.path === "/fields/System.Title");
      const descOp = patch.find((p) => p.path === "/fields/System.Description");
      const areaOp = patch.find((p) => p.path === "/fields/System.AreaPath");

      expect(titleOp?.value).toBe(sampleAction.title);
      expect(descOp?.value).toContain(sampleAction.description);
      expect(areaOp?.value).toBe("Conversa\\Backend");
    });

    it("dispatches simulated Azure DevOps Work Item creation", async () => {
      const adapter = new AzureDevOpsFormatAdapter();
      const res = await adapter.dispatch({
        title: sampleAction.title,
        description: sampleAction.description,
      });

      expect(res.success).toBe(true);
      expect(typeof res.workItemId).toBe("number");
      expect(res.url).toContain("https://dev.azure.com/");
    });
  });

  describe("SlackFormatAdapter", () => {
    it("constructs Slack Block Kit interactive message payload with approval buttons", () => {
      const adapter = new SlackFormatAdapter();
      const payload = adapter.formatBlockKitPayload(sampleAction);

      expect(payload.blocks).toBeDefined();
      const header = payload.blocks.find((b: any) => b.type === "header");
      const actions = payload.blocks.find((b: any) => b.type === "actions");

      expect(header.text.text).toContain("Conversa Meeting Action Item");
      expect(actions.block_id).toBe(`conversa_approval_${sampleAction.id}`);
      expect(actions.elements).toHaveLength(2);
      expect(actions.elements[0].action_id).toBe("approve_action_item");
      expect(actions.elements[1].action_id).toBe("reject_action_item");
    });
  });

  describe("Unified HandOffDispatcher", () => {
    it("orchestrates routing across all 5 native hand-off targets", async () => {
      const dispatcher = new HandOffDispatcher();

      const targets: Array<"jira" | "linear" | "github" | "azure-devops" | "slack"> = [
        "jira",
        "linear",
        "github",
        "azure-devops",
        "slack",
      ];

      for (const target of targets) {
        const result = await dispatcher.dispatch(target, sampleAction);
        expect(result.success).toBe(true);
        expect(result.destination).toBe(target);
        expect(result.externalUrl).toBeDefined();
      }
    });
  });
});
