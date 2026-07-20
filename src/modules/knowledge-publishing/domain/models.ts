import {
  ValidatedKnowledgePackage,
  CanonicalDecision,
  CanonicalAction,
  CanonicalRisk,
  CanonicalAssumption,
  CanonicalStakeholder,
  CanonicalProject,
  CanonicalRelationship,
  CognitiveDebt,
  MultiDimensionalConfidence,
  DataResidencyPolicy,
  ProvenanceChain,
} from "../../cognitive-collaboration/domain/models";

import { PrivacyClassification } from "../../meeting-intelligence/contracts/agent-contract";

export type { PrivacyClassification };

export interface PublicationManifest {
  publicationId: string;
  sourcePackageId: string;
  publisher: string;
  renderer: string;
  audience: string;
  templateVersion: string;
  schemaVersion: string;
  publicationVersion: string;
  generatedAt: number;
  dataResidencyPolicy?: DataResidencyPolicy;
  
  // 3-Hash Lineage Verification Model
  semanticHash: string;   // SHA-256 of Canonical Semantic Publication
  contentHash: string;    // SHA-256 of Rendered Artifact Content
  provenanceHash: string; // SHA-256 of Provenance & Source Evidence Chain
}

export interface PublishedArtifact<T = string | Record<string, unknown>> {
  renderedContent: T;
  semanticModel: Record<string, unknown>;
  manifest: PublicationManifest;
  schemaVersion: string;
  renderedAt: number;
  metadata: Record<string, unknown>;
}

// Semantic Publication Models

export interface BaseSemanticPublication {
  sourceId: string;
}

export interface ExecutivePublication extends BaseSemanticPublication {
  publicationType: "ExecutiveSummary";
  sourceId: string;
  title: string;
  executiveOverview: string;
  keyDecisions: CanonicalDecision[];
  majorRisks: CanonicalRisk[];
  strategicActions: CanonicalAction[];
  businessImpact: {
    resourceImpact: string;
    timelineImpact: string;
    strategicAlignment: string;
  };
  followUps: string[];
  overallConfidence?: MultiDimensionalConfidence;
  privacyClassification?: PrivacyClassification;
}

export interface EngineeringPublication extends BaseSemanticPublication {
  publicationType: "EngineeringMinutes";
  sourceId: string;
  title: string;
  technicalDecisions: CanonicalDecision[];
  architectureNotes: string[];
  openQuestions: string[];
  engineeringTasks: CanonicalAction[];
  dependencies: CanonicalRelationship[];
  assumptions: CanonicalAssumption[];
  overallConfidence?: MultiDimensionalConfidence;
}

export interface ActionRegisterPublication extends BaseSemanticPublication {
  publicationType: "ActionRegister";
  sourceId: string;
  actions: Array<{
    id: string;
    task: string;
    owner?: string;
    dueDate?: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
    status: "Open" | "InProgress" | "Completed" | "Deferred";
    dependencies: string[];
    confidence: number;
  }>;
  totalActions: number;
}

export interface DecisionRegisterPublication extends BaseSemanticPublication {
  publicationType: "DecisionRegister";
  sourceId: string;
  decisions: Array<{
    id: string;
    decision: string;
    rationale: string;
    supportingEvidenceCount: number;
    confidence: number;
    date: number;
    stakeholders: string[];
  }>;
  totalDecisions: number;
}

export interface RiskRegisterPublication extends BaseSemanticPublication {
  publicationType: "RiskRegister";
  sourceId: string;
  risks: Array<{
    id: string;
    risk: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    likelihood: "Low" | "Medium" | "High";
    evidenceCount: number;
    mitigation?: string;
    owner?: string;
    confidence: number;
  }>;
  totalRisks: number;
}

export type AudienceType = "Executive" | "Engineering" | "Product" | "Operations" | "CustomerSuccess";

export interface StakeholderBriefPublication extends BaseSemanticPublication {
  publicationType: "StakeholderBrief";
  sourceId: string;
  targetAudience: AudienceType;
  summary: string;
  relevantDecisions: CanonicalDecision[];
  relevantActions: CanonicalAction[];
  relevantRisks: CanonicalRisk[];
  keyTakeaways: string[];
}

export interface KnowledgePublicationPackage extends BaseSemanticPublication {
  publicationType: "MachinePackage";
  packageId: string;
  sourceId: string;
  sourcePackage: ValidatedKnowledgePackage;
  metadata: {
    publishedBy: string;
    environment: string;
    tags: string[];
  };
  version: string;
  schemaVersion: string;
  provenanceSummary: ProvenanceChain[];
  overallConfidence?: MultiDimensionalConfidence;
  publishedAt: number;
}

export type MachinePublication = KnowledgePublicationPackage;

export type SemanticPublication =
  | ExecutivePublication
  | EngineeringPublication
  | ActionRegisterPublication
  | DecisionRegisterPublication
  | RiskRegisterPublication
  | StakeholderBriefPublication
  | MachinePublication;
