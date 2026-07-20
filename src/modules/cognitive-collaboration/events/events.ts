import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import { ValidationReport, ValidatedKnowledgePackage } from "../domain/models";

export const COGNITIVE_COLLABORATION_EVENTS = {
  EVIDENCE_PUBLISHED: "cognitive_collaboration.evidence_published",
  EVIDENCE_VALIDATED: "cognitive_collaboration.evidence_validated",
  EVIDENCE_CONFLICT_DETECTED: "cognitive_collaboration.evidence_conflict_detected",
  DEBATE_STARTED: "cognitive_collaboration.debate_started",
  DEBATE_COMPLETED: "cognitive_collaboration.debate_completed",
  CONSENSUS_GENERATED: "cognitive_collaboration.consensus_generated",
  KNOWLEDGE_PACKAGE_PUBLISHED: "cognitive_collaboration.knowledge_package_published",
  SENSITIVE_DATA_DETECTED: "cognitive_collaboration.sensitive_data_detected",
} as const;

export interface EvidencePublishedPayload {
  sourceId: string;
  sourceType: string;
  evidencePackage: AgentEvidencePackage<any>;
}

export interface EvidenceValidatedPayload {
  sourceId: string;
  report: ValidationReport;
}

export interface EvidenceConflictDetectedPayload {
  sourceId: string;
  report: ValidationReport;
  conflictsCount: number;
}

export interface DebateCompletedPayload {
  sourceId: string;
  decision: "ConsensusPossible" | "TargetedRePass" | "HumanReviewRequired";
  rePassCapabilities?: string[];
  reasons?: string[];
}

export interface KnowledgePackagePublishedPayload {
  sourceId: string;
  packageId: string;
  knowledgePackage: ValidatedKnowledgePackage;
}
