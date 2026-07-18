import type { MeetingAnalysisProvider, AnalyzeInput, ChatInput } from "../../modules/analysis/domain/provider";
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
    const lowered = text.toLowerCase();
    const decisions: MeetingAnalysis["decisions"] = [];
    const proposedActions: MeetingAnalysis["proposedActions"] = [];
    const risks: string[] = [];
    const topics = ["launch", "billing", "planning", "demo", "publication", "security", "deployment"].filter((t) => lowered.includes(t));

    const now = new Date().toISOString();

    // Buildathon-readiness transcript heuristics (judge demo dataset)
    if (/pasted-transcript workflow.*primary public demo/i.test(text)) {
      decisions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Use pasted-transcript workflow as the primary public demo path.",
        rationale: "The team explicitly marks this path as the most reliable demo route.",
        sourceEvidence: "...pasted-transcript workflow will be the primary public demo...",
        confidence: 0.94,
        createdAt: now,
      });
    }

    if (/publish the current prototype.*experimental-use warning/i.test(text)) {
      decisions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Publish with explicit experimental/prototype warning.",
        rationale: "Publication is allowed only with transparent prototype disclosure.",
        sourceEvidence: "...publish the current prototype with an explicit experimental-use warning.",
        confidence: 0.9,
        createdAt: now,
      });
    }

    if (/production deployment.*blocked until authentication and durable persistence/i.test(text)) {
      decisions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Keep production deployment blocked until authentication and durable persistence are implemented.",
        rationale: "Authentication and persistence are explicit production blockers.",
        sourceEvidence: "...production deployment must remain blocked until authentication and durable persistence...",
        confidence: 0.96,
        createdAt: now,
      });
      risks.push("Production risk: authentication and durable persistence are missing prerequisites.");
    }

    if (/risk is that the vercel deployment may not match the latest github commit/i.test(text)) {
      risks.push("Vercel traceability risk: deployed application may not match latest GitHub commit.");
    }

    const mayaBy = text.match(/Maya:\s*I will verify [^\n]*? by (\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (mayaBy) {
      const due = parseHumanDate(mayaBy[1] ?? "");
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Verify GitHub and Wiki navigation.",
        ownerName: "Maya",
        ownerReference: null,
        dueDate: due,
        priority: "MEDIUM",
        targetSystem: "INTERNAL",
        actionType: "VALIDATION",
        rationale: "Public surface link integrity is required before publication.",
        sourceEvidence: "Maya: I will verify the GitHub and Wiki navigation by ...",
        confidence: 0.93,
        riskLevel: "MEDIUM",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

    const priyaBy = text.match(/Priya:\s*I will confirm the deployed commit and run the public smoke test by (\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (priyaBy) {
      const due = parseHumanDate(priyaBy[1] ?? "");
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Confirm deployed commit and run public smoke test.",
        ownerName: "Priya",
        ownerReference: null,
        dueDate: due,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "VALIDATION",
        rationale: "Release traceability and smoke validation gate publication quality.",
        sourceEvidence: "Priya: I will confirm the deployed commit and run the public smoke test by ...",
        confidence: 0.95,
        riskLevel: "HIGH",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (/propose we approve publication after the link scan, security tests, and public demo all pass/i.test(text)) {
      proposedActions.push({
        id: randomUUID(),
        meetingId: input.meetingId,
        description: "Approve publication only after link scan, security tests, and public demo pass.",
        ownerName: "Daniel",
        ownerReference: null,
        dueDate: null,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "APPROVAL_GATE",
        rationale: "Publication should remain gated by objective checks.",
        sourceEvidence: "Daniel: I propose we approve publication after the link scan, security tests, and public demo all pass.",
        confidence: 0.92,
        riskLevel: "HIGH",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now,
      });
    }

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
        ownerName: ownerMatch ? (ownerMatch[1] ?? null) : null,
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
        ownerName: ownerMatch ? (ownerMatch[1] ?? null) : null,
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
      risks.push("Billing dependency may resurface post-beta.");
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

    const summary = decisions.length || proposedActions.length
      ? `Extracted ${decisions.length} decision(s), ${proposedActions.length} proposed action(s), and ${risks.length} risk(s).`
      : "Transcript reviewed; no high-confidence decisions or actions extracted.";

    return {
      id: randomUUID(),
      meetingId: input.meetingId,
      summary,
      topics,
      decisions,
      proposedActions,
      risks,
      createdAt: now,
    };
  }

  async chat(input: ChatInput): Promise<string> {
    return "Fake chat response.";
  }
}

export class FailingAnalysisProvider implements MeetingAnalysisProvider {
  readonly name = "fake-failing";
  async analyze(_input: AnalyzeInput): Promise<MeetingAnalysis> {
    throw new Error("analysis provider unavailable");
  }

  async chat(_input: ChatInput): Promise<string> {
    throw new Error("chat provider unavailable");
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

function parseHumanDate(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthName = (m[2] ?? "").toLowerCase();
  const year = Number(m[3]);
  const monthMap: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const month = monthMap[monthName];
  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
}
