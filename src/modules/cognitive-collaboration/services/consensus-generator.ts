import { AgentEvidencePackage, EvidenceSource } from "../../meeting-intelligence/contracts/agent-contract";
import { IConsensusGenerator } from "../contracts/collaboration-contract";
import {
  CanonicalAction,
  CanonicalAssumption,
  CanonicalDecision,
  CanonicalProject,
  CanonicalRelationship,
  CanonicalRisk,
  CanonicalStakeholder,
  CognitiveDebt,
  MultiDimensionalConfidence,
  ProvenanceChain,
  ValidatedKnowledgePackage,
  ValidationReport,
} from "../domain/models";

export class ConsensusGenerator implements IConsensusGenerator {
  public async generateConsensus(
    sourceId: string,
    evidencePackages: AgentEvidencePackage<any>[],
    validationReport: ValidationReport,
    options?: { workspaceId?: string; sourceType?: "Meeting" | "Email" | "Slack" | "Document" | "CustomerCall" }
  ): Promise<ValidatedKnowledgePackage> {
    const packageId = `vkp_${sourceId}_${Date.now()}`;
    const workspaceId = options?.workspaceId;
    const sourceType = options?.sourceType || "Meeting";

    // Gather all evidence packages
    const pkgMap = new Map<string, AgentEvidencePackage<any>>();
    for (const pkg of evidencePackages) {
      pkgMap.set(pkg.agentId, pkg);
    }

    const decPkg = pkgMap.get("agent-decision-extraction");
    const actPkg = pkgMap.get("agent-action-extraction");
    const riskPkg = pkgMap.get("agent-risk");
    const knowPkg = pkgMap.get("agent-knowledge");
    const diarPkg = pkgMap.get("agent-diarization");
    const topicPkg = pkgMap.get("agent-topic-segmentation");

    // Collect base evidence sources
    const allEvidenceSources: EvidenceSource[] = [];
    for (const pkg of evidencePackages) {
      if (Array.isArray(pkg.evidence)) {
        allEvidenceSources.push(...pkg.evidence);
      }
    }

    // Common Provenance
    const commonProvenance: ProvenanceChain = {
      originatingPipeline: "Conversa-Cognitive-Collaboration-v2",
      originatingSourceId: sourceId,
      agentIds: evidencePackages.map((p) => p.agentId),
      capabilities: evidencePackages.map((p) => p.agentId.replace("agent-", "")),
      evidencePackageIds: evidencePackages.map((p) => p.packageId),
      transcriptLocations: allEvidenceSources.slice(0, 10),
      timestamp: Date.now(),
    };

    // 1. Synthesize Canonical Decisions
    const canonicalDecisions: CanonicalDecision[] = [];
    const extractedDecisions: any[] = decPkg?.payload?.decisions || [];

    extractedDecisions.forEach((dec: any, idx: number) => {
      const supporting = dec.evidence || allEvidenceSources.filter((e) => e.verbatimQuote?.includes(dec.topic));
      const dissenting: EvidenceSource[] = [];

      // Check if risk agent dissents
      const conflictingRisk = validationReport.unresolvedConflicts.find((c) => c.topic === dec.topic);
      if (conflictingRisk) {
        dissenting.push({
          id: `diss_${idx}`,
          meetingId: sourceId,
          verbatimQuote: conflictingRisk.description,
        });
      }

      const conf = this.deriveConfidence(decPkg?.overallConfidence || 0.85, validationReport, dissenting.length > 0);

      canonicalDecisions.push({
        id: `c_dec_${sourceId}_${idx + 1}`,
        title: dec.title,
        rationale: dec.description || `Decision agreed upon during topic '${dec.topic || "General"}'.`,
        owner: dec.owner || undefined,
        status: conf.overallConfidence > 0.7 ? "Approved" : "Proposed",
        supportingEvidence: supporting,
        dissentingEvidence: dissenting,
        confidence: conf,
        provenance: commonProvenance,
        explanation: `Synthesized from Decision Extraction Agent with ${supporting.length} corroborating quotes. ${
          dissenting.length > 0 ? "Contains dissenting risk flags." : "No dissenting evidence."
        }`,
      });
    });

    // 2. Synthesize Canonical Actions
    const canonicalActions: CanonicalAction[] = [];
    const extractedActions: any[] = actPkg?.payload?.actions || [];

    extractedActions.forEach((act: any, idx: number) => {
      const supporting = act.evidence || allEvidenceSources.filter((e) => e.speakerName === act.owner);
      const conf = this.deriveConfidence(actPkg?.overallConfidence || 0.85, validationReport, !act.owner);

      canonicalActions.push({
        id: `c_act_${sourceId}_${idx + 1}`,
        title: act.title,
        owner: act.owner || "Unassigned",
        dueDate: act.dueDate,
        priority: act.priority || "Medium",
        status: "Open",
        supportingEvidence: supporting,
        dissentingEvidence: [],
        confidence: conf,
        provenance: commonProvenance,
        explanation: `Synthesized from Action Extraction Agent. Owner '${act.owner}' assigned based on diarized evidence.`,
      });
    });

    // 3. Synthesize Canonical Risks
    const canonicalRisks: CanonicalRisk[] = [];
    const extractedRisks: any[] = riskPkg?.payload?.risks || [];

    extractedRisks.forEach((r: any, idx: number) => {
      const supporting = r.evidence || [];
      const conf = this.deriveConfidence(riskPkg?.overallConfidence || 0.8, validationReport, false);

      canonicalRisks.push({
        id: `c_risk_${sourceId}_${idx + 1}`,
        description: r.description || r.title,
        severity: r.severity || "Medium",
        likelihood: r.likelihood || "Medium",
        mitigation: r.mitigation,
        supportingEvidence: supporting,
        dissentingEvidence: [],
        confidence: conf,
        provenance: commonProvenance,
        explanation: `Identified by Risk Agent. Severity level evaluated as ${r.severity || "Medium"}.`,
      });
    });

    // 4. Synthesize Canonical Assumptions & Stakeholders & Projects
    const canonicalAssumptions: CanonicalAssumption[] = [];
    const canonicalStakeholders: CanonicalStakeholder[] = [];
    const canonicalProjects: CanonicalProject[] = [];
    const canonicalRelationships: CanonicalRelationship[] = [];

    if (knowPkg?.payload?.knowledgeItems) {
      knowPkg.payload.knowledgeItems.forEach((k: any, idx: number) => {
        if (k.type === "Assumption") {
          canonicalAssumptions.push({
            id: `c_assm_${sourceId}_${idx + 1}`,
            statement: k.title,
            validated: k.validated ?? false,
            supportingEvidence: k.evidence || [],
            dissentingEvidence: [],
            confidence: this.deriveConfidence(0.8, validationReport, false),
            provenance: commonProvenance,
            explanation: "Mapped from Knowledge Mapping Agent.",
          });
        }
      });
    }

    if (diarPkg?.payload?.speakers) {
      diarPkg.payload.speakers.forEach((spk: any, idx: number) => {
        canonicalStakeholders.push({
          id: `c_stk_${sourceId}_${idx + 1}`,
          name: spk.name || spk.speakerId,
          role: spk.role || "Participant",
          supportingEvidence: allEvidenceSources.filter((e) => e.speakerId === spk.speakerId),
          confidence: this.deriveConfidence(0.9, validationReport, false),
          provenance: commonProvenance,
        });
      });
    }

    // 5. Track Cognitive Debt
    const cognitiveDebtItems: CognitiveDebt[] = [];

    // Add unassigned actions to Cognitive Debt
    canonicalActions.forEach((act) => {
      if (act.owner === "Unassigned") {
        cognitiveDebtItems.push({
          id: `cd_act_owner_${act.id}`,
          topic: "Action Ownership",
          description: `Action item '${act.title}' requires an explicit human assignment.`,
          unresolvedEvidenceIds: act.supportingEvidence.map((e) => e.id),
          confidence: act.confidence.overallConfidence,
          impact: "Medium",
          recommendedFollowUp: "Review transcript segment to identify responsible party.",
          priority: 2,
          humanReviewRecommended: false,
        });
      }
    });

    // Add unresolved conflicts to Cognitive Debt
    validationReport.unresolvedConflicts.forEach((conflict, idx) => {
      cognitiveDebtItems.push({
        id: `cd_conflict_${idx + 1}`,
        topic: conflict.topic,
        description: conflict.description,
        unresolvedEvidenceIds: [],
        confidence: 0.5,
        impact: "High",
        recommendedFollowUp: `Reconcile discrepancy between ${conflict.capabilityA} and ${conflict.capabilityB}.`,
        priority: 1,
        humanReviewRecommended: true,
      });
    });

    // Compute Overall Confidence
    const overallConf = this.deriveConfidence(
      validationReport.agreementScore,
      validationReport,
      cognitiveDebtItems.length > 0
    );

    return {
      packageId,
      workspaceId,
      sourceId,
      sourceType,
      createdAt: Date.now(),
      manifestVersion: "2.0-cognitive-collaboration",
      decisions: canonicalDecisions,
      actions: canonicalActions,
      risks: canonicalRisks,
      assumptions: canonicalAssumptions,
      openQuestions: cognitiveDebtItems.map((cd) => cd.description),
      stakeholders: canonicalStakeholders,
      projects: canonicalProjects,
      relationships: canonicalRelationships,
      cognitiveDebt: cognitiveDebtItems,
      evidencePackageIds: evidencePackages.map((p) => p.packageId),
      provenanceSummary: [commonProvenance],
      overallConfidence: overallConf,
      privacyClassification: "Internal",
      dataResidencyPolicy: "Global",
      policyNotes: [
        `Consensus generated across ${evidencePackages.length} specialized agents.`,
        `Agreement score: ${validationReport.agreementScore}, Contradiction score: ${validationReport.contradictionScore}.`,
      ],
      governanceStatus:
        validationReport.recommendedAction === "HumanReviewRequired" ? "PendingReview" : "Validated",
    };
  }

  private deriveConfidence(
    baseConfidence: number,
    report: ValidationReport,
    hasConflictOrDebt: boolean
  ): MultiDimensionalConfidence {
    const evidenceConfidence = baseConfidence;
    const provenanceConfidence = report.completenessScore;
    const validationConfidence = 1 - report.ambiguityScore;
    const agreementConfidence = report.agreementScore;
    const governanceConfidence = 1 - report.contradictionScore;

    let overall = (evidenceConfidence + agreementConfidence + governanceConfidence) / 3;
    if (hasConflictOrDebt) overall -= 0.1;

    overall = Math.min(1.0, Math.max(0.1, Number(overall.toFixed(2))));

    return {
      evidenceConfidence: Number(evidenceConfidence.toFixed(2)),
      provenanceConfidence: Number(provenanceConfidence.toFixed(2)),
      validationConfidence: Number(validationConfidence.toFixed(2)),
      agreementConfidence: Number(agreementConfidence.toFixed(2)),
      governanceConfidence: Number(governanceConfidence.toFixed(2)),
      publicationConfidence: Number(overall.toFixed(2)),
      overallConfidence: overall,
    };
  }
}
