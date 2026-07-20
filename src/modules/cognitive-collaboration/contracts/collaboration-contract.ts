import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import {
  EvidenceComparisonReport,
  EvidenceLineageTree,
  ValidationReport,
  ValidatedKnowledgePackage,
  DataResidencyPolicy,
} from "../domain/models";

export interface EvidenceFilter {
  workspaceId?: string;
  meetingId?: string;
  sourceId?: string;
  sourceType?: string;
  agentId?: string;
  capability?: string;
  speakerId?: string;
  topic?: string;
  transcriptSegmentId?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  minConfidence?: number;
  entityId?: string;
  correlationId?: string;
}

export interface IEvidenceRepository {
  append(evidencePackage: AgentEvidencePackage<any>, metadata?: Record<string, any>): Promise<void>;
  retrieve(packageId: string): Promise<AgentEvidencePackage<any> | null>;
  filter(filterCriteria: EvidenceFilter): Promise<AgentEvidencePackage<any>[]>;
  replay(sourceId: string, filterCriteria?: EvidenceFilter): Promise<AgentEvidencePackage<any>[]>;
  compare(packageIdA: string, packageIdB: string): Promise<EvidenceComparisonReport>;
  getLineage(packageId: string): Promise<EvidenceLineageTree>;
}

export interface IPrivacyGuardrail {
  sanitize<T>(
    evidencePackage: AgentEvidencePackage<T>,
    policy?: DataResidencyPolicy
  ): { sanitizedPackage: AgentEvidencePackage<T>; tokenMapCount: number };
  
  restore<T>(
    sanitizedPackage: AgentEvidencePackage<T>
  ): { restoredPackage: AgentEvidencePackage<T>; restoredCount: number };
  
  classify(text: string): { sensitivity: string; detectedPatterns: string[] };
  
  audit(): { totalSanitized: number; activeTokens: number; auditLogs: string[] };
}

export interface ICrossAgentValidationEngine {
  validate(
    sourceId: string,
    evidencePackages: AgentEvidencePackage<any>[]
  ): Promise<ValidationReport>;
}

export interface IDebateCoordinatorPolicy {
  minConfidence: number;
  maxContradictionRatio: number;
  minAgreementRatio: number;
  maxAmbiguityScore: number;
  maxRePassAttempts: number;
}

export interface IDebateCoordinator {
  evaluateDebate(
    validationReport: ValidationReport,
    policy?: Partial<IDebateCoordinatorPolicy>
  ): Promise<{
    decision: "ConsensusPossible" | "TargetedRePass" | "HumanReviewRequired";
    rePassCapabilities?: string[];
    reasons?: string[];
  }>;
}

export interface IConsensusGenerator {
  generateConsensus(
    sourceId: string,
    evidencePackages: AgentEvidencePackage<any>[],
    validationReport: ValidationReport,
    options?: { workspaceId?: string; sourceType?: "Meeting" | "Email" | "Slack" | "Document" | "CustomerCall" }
  ): Promise<ValidatedKnowledgePackage>;
}
