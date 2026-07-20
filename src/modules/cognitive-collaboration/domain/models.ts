import {
  AgentEvidencePackage,
  EvidenceSource,
  GovernanceMetadata,
  PrivacyClassification,
} from "../../meeting-intelligence/contracts/agent-contract";

export type DataResidencyPolicy =
  | "Global"
  | "US"
  | "EU"
  | "India"
  | "CustomerManaged"
  | "AirGapped";

export interface MultiDimensionalConfidence {
  evidenceConfidence: number;
  provenanceConfidence: number;
  validationConfidence: number;
  agreementConfidence: number;
  governanceConfidence: number;
  publicationConfidence: number;
  overallConfidence: number;
}

export interface ProvenanceChain {
  originatingPipeline: string;
  originatingSourceId: string;
  agentIds: string[];
  capabilities: string[];
  evidencePackageIds: string[];
  transcriptLocations?: EvidenceSource[];
  timestamp: number;
}

export interface CognitiveDebt {
  id: string;
  topic: string;
  description: string;
  unresolvedEvidenceIds: string[];
  confidence: number;
  impact: "Low" | "Medium" | "High" | "Critical";
  recommendedFollowUp: string;
  priority: number;
  expirationTimestamp?: number;
  humanReviewRecommended: boolean;
}

export interface CanonicalDecision {
  id: string;
  title: string;
  rationale: string;
  owner?: string;
  status: "Proposed" | "Approved" | "Rejected" | "UnderReview";
  supportingEvidence: EvidenceSource[];
  dissentingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
  explanation: string;
}

export interface CanonicalAction {
  id: string;
  title: string;
  owner: string;
  dueDate?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "InProgress" | "Completed" | "Deferred";
  supportingEvidence: EvidenceSource[];
  dissentingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
  explanation: string;
}

export interface CanonicalRisk {
  id: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  likelihood: "Low" | "Medium" | "High";
  mitigation?: string;
  supportingEvidence: EvidenceSource[];
  dissentingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
  explanation: string;
}

export interface CanonicalAssumption {
  id: string;
  statement: string;
  validated: boolean;
  supportingEvidence: EvidenceSource[];
  dissentingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
  explanation: string;
}

export interface CanonicalStakeholder {
  id: string;
  name: string;
  role: string;
  organization?: string;
  sentiment?: "Positive" | "Neutral" | "Negative" | "Mixed";
  supportingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
}

export interface CanonicalProject {
  id: string;
  name: string;
  codeName?: string;
  status?: string;
  supportingEvidence: EvidenceSource[];
  confidence: MultiDimensionalConfidence;
  provenance: ProvenanceChain;
}

export interface CanonicalRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  supportingEvidence: EvidenceSource[];
  confidence: number;
}

export interface ValidatedKnowledgePackage {
  packageId: string;
  workspaceId?: string;
  sourceId: string; // meetingId, documentId, emailId, slackChannelId, customerCallId
  sourceType: "Meeting" | "Email" | "Slack" | "Document" | "CustomerCall" | "Other";
  createdAt: number;
  manifestVersion: string;

  // Canonical Knowledge Items
  decisions: CanonicalDecision[];
  actions: CanonicalAction[];
  risks: CanonicalRisk[];
  assumptions: CanonicalAssumption[];
  openQuestions: string[];
  stakeholders: CanonicalStakeholder[];
  projects: CanonicalProject[];
  relationships: CanonicalRelationship[];

  // Cognitive Debt
  cognitiveDebt: CognitiveDebt[];

  // Evidence & Provenance
  evidencePackageIds: string[];
  provenanceSummary: ProvenanceChain[];

  // Governance & Metadata
  overallConfidence: MultiDimensionalConfidence;
  privacyClassification: PrivacyClassification;
  dataResidencyPolicy: DataResidencyPolicy;
  policyNotes: string[];
  governanceStatus: "Validated" | "PendingReview" | "Rejected";
}

export interface ValidationReport {
  reportId: string;
  workspaceId?: string;
  sourceId: string;
  evaluatedPackageIds: string[];
  agreementScore: number; // 0 to 1
  contradictionScore: number; // 0 to 1
  completenessScore: number; // 0 to 1
  ambiguityScore: number; // 0 to 1
  missingEvidenceCapabilities: string[];
  unresolvedConflicts: {
    capabilityA: string;
    capabilityB: string;
    topic: string;
    description: string;
  }[];
  confidenceAdjustments: Record<string, number>;
  recommendedAction: "ConsensusPossible" | "TargetedRePass" | "HumanReviewRequired";
  rePassRequestedCapabilities?: string[];
  humanReviewReasons?: string[];
  evaluatedAt: number;
}

export interface EvidenceComparisonReport {
  packageIdA: string;
  packageIdB: string;
  overlapScore: number;
  fieldDiffs: {
    field: string;
    valueA: any;
    valueB: any;
    conflict: boolean;
  }[];
  comparedAt: number;
}

export interface EvidenceLineageTree {
  rootPackageId: string;
  ancestors: string[];
  descendants: string[];
  corrections: string[];
}
