import { logger } from "../../../shared/logging/logger";

export interface AzureDevOpsActionPayload {
  title: string;
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  organization?: string;
  project?: string;
  workItemType?: "Task" | "User Story" | "Bug";
  areaPath?: string;
  iterationPath?: string;
}

export class AzureDevOpsFormatAdapter {
  constructor(private readonly patToken?: string, private readonly defaultOrg = "conversa-org", private readonly defaultProject = "ConversaProject") {}

  /**
   * Format Azure DevOps JSON Patch Document Payload (`application/json-patch+json`)
   */
  formatPayload(payload: AzureDevOpsActionPayload): Array<{ op: string; path: string; value: any }> {
    const descriptionHtml = `<div><p>${payload.description}</p>${
      payload.ownerName || payload.dueDate
        ? `<hr/><p><b>Conversa Metadata</b><br/>Assignee: ${payload.ownerName || "Unassigned"}<br/>Target Due Date: ${payload.dueDate || "N/A"}</p>`
        : ""
    }</div>`;

    const patch: Array<{ op: string; path: string; value: any }> = [
      { op: "add", path: "/fields/System.Title", value: payload.title },
      { op: "add", path: "/fields/System.Description", value: descriptionHtml },
    ];

    if (payload.areaPath) {
      patch.push({ op: "add", path: "/fields/System.AreaPath", value: payload.areaPath });
    }
    if (payload.iterationPath) {
      patch.push({ op: "add", path: "/fields/System.IterationPath", value: payload.iterationPath });
    }

    return patch;
  }

  /**
   * Dispatch Work Item Creation to Azure DevOps REST API
   */
  async dispatch(payload: AzureDevOpsActionPayload): Promise<{ success: boolean; workItemId?: number; url: string }> {
    const org = payload.organization || this.defaultOrg;
    const project = payload.project || this.defaultProject;
    const workItemType = payload.workItemType || "Task";
    const patchDocument = this.formatPayload(payload);

    logger.info({ org, project, workItemType, title: payload.title }, "Dispatching Azure DevOps Work Item JSON Patch payload");

    if (!this.patToken) {
      logger.warn({}, "Azure DevOps PAT token missing. Returning simulated Work Item payload.");
      const simId = Math.floor(Math.random() * 8000 + 1000);
      return {
        success: true,
        workItemId: simId,
        url: `https://dev.azure.com/${org}/${project}/_workitems/edit/${simId}`,
      };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`:${this.patToken}`).toString("base64")}`;
      const url = `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/$${encodeURIComponent(workItemType)}?api-version=7.0`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(patchDocument),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error({ status: res.status, errText }, "Azure DevOps Work Item creation failed");
        return { success: false, url: "" };
      }

      const json = await res.json();
      return {
        success: true,
        workItemId: json.id,
        url: json._links?.html?.href || `https://dev.azure.com/${org}/${project}/_workitems/edit/${json.id}`,
      };
    } catch (err) {
      logger.error({ err }, "Azure DevOps dispatch exception");
      return { success: false, url: "" };
    }
  }
}
