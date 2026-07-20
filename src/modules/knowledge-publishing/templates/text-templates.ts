import { SemanticPublication } from "../domain/models";

export class TextTemplates {
  public static render(model: SemanticPublication): string {
    switch (model.publicationType) {
      case "ExecutiveSummary":
        return [
          `=== ${model.title.toUpperCase()} ===`,
          ``,
          `OVERVIEW: ${model.executiveOverview}`,
          ``,
          `KEY DECISIONS:`,
          ...model.keyDecisions.map((d: any) => `* ${d.title || d.decision} (Rationale: ${d.rationale || "N/A"})`),
          ``,
          `MAJOR RISKS:`,
          ...model.majorRisks.map((r: any) => `* [${r.severity || "Medium"}] ${r.description}`),
          ``,
          `STRATEGIC ACTIONS:`,
          ...model.strategicActions.map((a: any) => `* ${a.title || a.description} [Owner: ${a.owner || "Unassigned"}]`),
        ].join("\n");

      case "ActionRegister":
        return [
          `=== ACTION REGISTER (${model.sourceId}) ===`,
          ...model.actions.map(
            (a) => `[${a.priority}] ${a.task} | Owner: ${a.owner || "Unassigned"} | Status: ${a.status}`
          ),
          `Total Actions: ${model.totalActions}`,
        ].join("\n");

      default:
        return [
          `=== ${model.publicationType.toUpperCase()} ===`,
          JSON.stringify(model, null, 2),
        ].join("\n");
    }
  }
}
