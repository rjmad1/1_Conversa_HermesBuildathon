import type { AgentPlan } from "./agent-plan";
import type { AgentHandoff } from "./handoff";

export interface MeetingManager {
  plan(transcript: string): Promise<{ plan: AgentPlan; inputTokens: number; outputTokens: number; latencyMs: number }>;
}

export interface DecisionSpecialist {
  extract(handoff: AgentHandoff): Promise<{ decisions: any[]; inputTokens: number; outputTokens: number; latencyMs: number }>;
}

export interface RiskSpecialist {
  extract(handoff: AgentHandoff): Promise<{ risks: any[]; inputTokens: number; outputTokens: number; latencyMs: number }>;
}

export interface ActionSpecialist {
  extract(handoff: AgentHandoff): Promise<{ proposedActions: any[]; inputTokens: number; outputTokens: number; latencyMs: number }>;
}

export interface QAReviewResult {
  approved: boolean;
  reason: string | null;
  escalated: boolean;
  unresolvedQuestions: string[];
  groundingPassed: boolean;
  policyPassed: boolean;
}

export interface QAReviewer {
  review(findings: any, handoff: AgentHandoff): Promise<{ result: QAReviewResult; inputTokens: number; outputTokens: number; latencyMs: number }>;
}
