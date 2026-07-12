import type { MeetingAnalysisProvider, AnalyzeInput } from "../../modules/analysis/domain/provider";
import type { MeetingAnalysis } from "../../shared/validation/schemas";
import { randomUUID } from "node:crypto";

/**
 * Deterministic fake analysis. Derives decisions/actions from the transcript text using
 * simple keyword heuristics so output is reproducible and evidence-backed. Does not fabricate
 * owners/dates it cannot find (those stay null). Low-temperature deterministic by construction.
 */
export class FakeAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "fake";
  async analyze(input: AnalyzeInput): Promise<MeetingAnalysis> {
    const text = input.transcriptContent;
    const decisions: MeetingAnalysis["decisions"] = [];
    const proposedActions: MeetingAnalysis["proposedActions"] = [];
    const topics = ["launch", "billing", "planning"].filter((t) => text.toLowerCase().includes(t));

    const now = new Date().toISOString();

    if (/launch/i.test(text)) {
      decisions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Launch the beta on the 15th.",
        rationale: "Team consensus to ship beta.",
        sourceEvidence: "Team agreed to launch the beta on the 15th.",
        confidence: 0.9,
        createdAt: now,
      });
      // Owner "Priya" is extracted only if named in transcript; otherwise ownerName=null.
      const ownerMatch = text.match(/([A-Z][a-z]+)\s+owns? the launch/i);
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Complete the beta launch checklist.",
        ownerName: ownerMatch ? ownerMatch[1] : null,
        ownerReference: null,
        dueDate: /15th/.test(text) ? isoForDay(15) : null,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "TASK",
        rationale: "Required for beta launch.",
        sourceEvidence: "Team agreed to launch the beta on the 15th.",
        confidence: 0.85,
        riskLevel: "MEDIUM",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (/rfc/i.test(text)) {
      const ownerMatch = text.match(/([A-Z][a-z]+)\s+will draft the RFC/i);
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Draft the integration RFC.",
        ownerName: ownerMatch ? ownerMatch[1] : null,
        ownerReference: null,
        dueDate: /friday/i.test(text) ? isoForWeekday(5) : null,
        priority: "MEDIUM",
        targetSystem: "INTERNAL",
        actionType: "DOC",
        rationale: "Needed before integration work.",
        sourceEvidence: "Rajeev will draft the RFC by Friday.",
        confidence: 0.8,
        riskLevel: "LOW",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (/defer/i.test(text)) {
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Defer billing integration to next quarter.",
        ownerName: null,
        ownerReference: null,
        dueDate: null,
        priority: "LOW",
        targetSystem: "INTERNAL",
        actionType: "DECISION",
        rationale: "Reduce scope for beta.",
        sourceEvidence: "We decided to defer the billing integration.",
        confidence: 0.7,
        riskLevel: "LOW",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      id: randomUUID(),
      meetingId: input.meetingId,
      summary: "Beta launch planning; billing deferred.",
      topics,
      decisions,
      proposedActions,
      risks: ["Billing dependency may resurface post-beta."],
      createdAt: now,
    };
  }
}

export class FailingAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "fake-failing";
  async analyze(_input: AnalyzeInput): Promise<MeetingAnalysis> {
    throw new Error("analysis provider unavailable");
  }
}

function isoForDay(day: number): string {
  const d = new Date();
  d.setDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoForWeekday(dow: number): string {
  const d = new Date();
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
