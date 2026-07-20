import { SemanticPublication } from "../domain/models";

export class MarkdownTemplates {
  public static render(model: SemanticPublication): string {
    switch (model.publicationType) {
      case "ExecutiveSummary":
        return [
          `# ${model.title}`,
          ``,
          `> **Executive Overview**: ${model.executiveOverview}`,
          ``,
          `## Key Decisions`,
          ...(model.keyDecisions.length > 0
            ? model.keyDecisions.map((d: any) => `- **${d.title || d.decision}** (Rationale: ${d.rationale || "N/A"})`)
            : [`*No major decisions recorded.*`]),
          ``,
          `## Major Risks`,
          ...(model.majorRisks.length > 0
            ? model.majorRisks.map((r: any) => `- **[${r.severity || "Medium"}]** ${r.description} (Mitigation: ${r.mitigation || "Pending"})`)
            : [`*No major risks identified.*`]),
          ``,
          `## Strategic Actions`,
          ...(model.strategicActions.length > 0
            ? model.strategicActions.map((a: any) => `- [ ] **${a.title || a.description}** - Owner: ${a.owner || "Unassigned"} (Due: ${a.dueDate || "TBD"})`)
            : [`*No strategic actions pending.*`]),
          ``,
          `## Business Impact`,
          `- Resource Impact: ${model.businessImpact.resourceImpact}`,
          `- Timeline Impact: ${model.businessImpact.timelineImpact}`,
          `- Strategic Alignment: ${model.businessImpact.strategicAlignment}`,
          ``,
          `## Follow-ups`,
          ...model.followUps.map((f) => `- ${f}`),
        ].join("\n");

      case "EngineeringMinutes":
        return [
          `# ${model.title}`,
          ``,
          `## Technical Decisions`,
          ...model.technicalDecisions.map((d: any) => `### ${d.title || d.decision}\n- **Rationale**: ${d.rationale}\n- **Confidence**: ${((d.confidence?.overallConfidence ?? 1.0) * 100).toFixed(0)}%`),
          ``,
          `## Architecture Notes`,
          ...model.architectureNotes.map((n) => `- ${n}`),
          ``,
          `## Open Questions`,
          ...model.openQuestions.map((q) => `- ❓ ${q}`),
          ``,
          `## Engineering Tasks`,
          ...model.engineeringTasks.map((t: any) => `- [ ] ${t.title || t.description} (Owner: ${t.owner || "TBD"})`),
          ``,
          `## Dependencies & Assumptions`,
          `### Assumptions`,
          ...model.assumptions.map((a) => `- ${a.statement}`),
          `### Dependencies`,
          ...model.dependencies.map((dep) => `- ${dep.sourceEntityId} ──[${dep.relationshipType}]──> ${dep.targetEntityId}`),
        ].join("\n");

      case "ActionRegister":
        return [
          `# Action Register (Source: ${model.sourceId})`,
          ``,
          `| Task | Owner | Priority | Status | Due Date |`,
          `| :--- | :--- | :--- | :--- | :--- |`,
          ...model.actions.map((a) => `| ${a.task} | ${a.owner || "Unassigned"} | ${a.priority} | ${a.status} | ${a.dueDate || "N/A"} |`),
          ``,
          `*Total Actions: ${model.totalActions}*`,
        ].join("\n");

      case "DecisionRegister":
        return [
          `# Decision Register (Source: ${model.sourceId})`,
          ``,
          `| Decision | Rationale | Stakeholders | Confidence | Evidence Count |`,
          `| :--- | :--- | :--- | :--- | :--- |`,
          ...model.decisions.map((d) => `| ${d.decision} | ${d.rationale} | ${d.stakeholders.join(", ") || "None"} | ${(d.confidence * 100).toFixed(0)}% | ${d.supportingEvidenceCount} |`),
          ``,
          `*Total Decisions: ${model.totalDecisions}*`,
        ].join("\n");

      case "RiskRegister":
        return [
          `# Risk Register (Source: ${model.sourceId})`,
          ``,
          `| Risk | Severity | Likelihood | Mitigation | Owner |`,
          `| :--- | :--- | :--- | :--- | :--- |`,
          ...model.risks.map((r) => `| ${r.risk} | ${r.severity} | ${r.likelihood} | ${r.mitigation || "None"} | ${r.owner || "Unassigned"} |`),
          ``,
          `*Total Risks: ${model.totalRisks}*`,
        ].join("\n");

      case "StakeholderBrief":
        return [
          `# Stakeholder Brief - ${model.targetAudience}`,
          ``,
          `> ${model.summary}`,
          ``,
          `## Key Takeaways`,
          ...model.keyTakeaways.map((t) => `- ${t}`),
          ``,
          `## Relevant Decisions`,
          ...model.relevantDecisions.map((d: any) => `- ${d.title || d.decision}`),
          ``,
          `## Relevant Actions`,
          ...model.relevantActions.map((a: any) => `- ${a.title || a.description}`),
        ].join("\n");

      case "MachinePackage":
        return [
          `# Machine Publication Package`,
          `\`\`\`json`,
          JSON.stringify(model, null, 2),
          `\`\`\``,
        ].join("\n");

      default:
        return JSON.stringify(model, null, 2);
    }
  }
}
