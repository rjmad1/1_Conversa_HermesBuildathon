import { SemanticPublication } from "../domain/models";

export class HtmlTemplates {
  public static render(model: SemanticPublication): string {
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    switch (model.publicationType) {
      case "ExecutiveSummary":
        return `
<div class="conversa-publication executive-summary">
  <h1>${escapeHtml(model.title)}</h1>
  <div class="overview">
    <p><strong>Overview:</strong> ${escapeHtml(model.executiveOverview)}</p>
  </div>
  <section class="decisions">
    Pre-rendered Decisions count: ${model.keyDecisions.length}
    <ul>
      ${model.keyDecisions.map((d: any) => `<li><strong>${escapeHtml(d.title || d.decision || "")}</strong> - ${escapeHtml(d.rationale || "")}</li>`).join("\n")}
    </ul>
  </section>
  <section class="risks">
    <h2>Major Risks</h2>
    <ul>
      ${model.majorRisks.map((r: any) => `<li><span class="badge ${escapeHtml((r.severity || "medium").toLowerCase())}">${escapeHtml(r.severity || "Medium")}</span> ${escapeHtml(r.description)}</li>`).join("\n")}
    </ul>
  </section>
  <section class="actions">
    <h2>Strategic Actions</h2>
    <ul>
      ${model.strategicActions.map((a: any) => `<li>${escapeHtml(a.title || a.description || "")} (Owner: ${escapeHtml(a.owner || "Unassigned")})</li>`).join("\n")}
    </ul>
  </section>
</div>`.trim();

      case "ActionRegister":
        return `
<div class="conversa-publication action-register">
  <h1>Action Register (${escapeHtml(model.sourceId)})</h1>
  <table>
    <thead>
      <tr><th>Task</th><th>Owner</th><th>Priority</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${model.actions.map((a) => `<tr><td>${escapeHtml(a.task)}</td><td>${escapeHtml(a.owner || "Unassigned")}</td><td>${escapeHtml(a.priority)}</td><td>${escapeHtml(a.status)}</td></tr>`).join("\n")}
    </tbody>
  </table>
</div>`.trim();

      case "DecisionRegister":
        return `
<div class="conversa-publication decision-register">
  <h1>Decision Register (${escapeHtml(model.sourceId)})</h1>
  <table>
    <thead>
      <tr><th>Decision</th><th>Rationale</th><th>Confidence</th></tr>
    </thead>
    <tbody>
      ${model.decisions.map((d) => `<tr><td>${escapeHtml(d.decision)}</td><td>${escapeHtml(d.rationale)}</td><td>${(d.confidence * 100).toFixed(0)}%</td></tr>`).join("\n")}
    </tbody>
  </table>
</div>`.trim();

      case "RiskRegister":
        return `
<div class="conversa-publication risk-register">
  <h1>Risk Register (${escapeHtml(model.sourceId)})</h1>
  <table>
    <thead>
      <tr><th>Risk</th><th>Severity</th><th>Likelihood</th><th>Mitigation</th></tr>
    </thead>
    <tbody>
      ${model.risks.map((r) => `<tr><td>${escapeHtml(r.risk)}</td><td>${escapeHtml(r.severity)}</td><td>${escapeHtml(r.likelihood)}</td><td>${escapeHtml(r.mitigation || "None")}</td></tr>`).join("\n")}
    </tbody>
  </table>
</div>`.trim();

      default:
        return `<div class="conversa-publication generic"><h2>${escapeHtml(model.publicationType)}</h2><pre>${escapeHtml(JSON.stringify(model, null, 2))}</pre></div>`;
    }
  }
}
