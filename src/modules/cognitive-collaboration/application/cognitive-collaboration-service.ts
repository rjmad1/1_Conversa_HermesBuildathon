import { PlatformEventBus, PlatformEvent } from "../../../platform/events";
import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import { MEETING_INTELLIGENCE_EVENTS } from "../../meeting-intelligence/events/events";
import { ConsensusGenerator } from "../services/consensus-generator";
import { CrossAgentValidationEngine } from "../services/cross-agent-validation-engine";
import { DebateCoordinator } from "../services/debate-coordinator";
import { PrivacyGuardrail } from "../services/privacy-guardrail";
import { EvidenceRepository } from "../repository/evidence-repository";
import { COGNITIVE_COLLABORATION_EVENTS } from "../events/events";
import { ValidatedKnowledgePackage } from "../domain/models";

export class CognitiveCollaborationService {
  constructor(
    private repository: EvidenceRepository,
    private privacyGuardrail: PrivacyGuardrail,
    private validationEngine: CrossAgentValidationEngine,
    private debateCoordinator: DebateCoordinator,
    private consensusGenerator: ConsensusGenerator,
    private eventBus: PlatformEventBus
  ) {}

  public subscribeToPipelineEvents(): void {
    // Listen to pipeline completed event to process evidence packages into validated knowledge
    this.eventBus.subscribe(MEETING_INTELLIGENCE_EVENTS.PIPELINE_COMPLETED, async (event: PlatformEvent<any>) => {
      const payload = event.payload;
      if (payload && payload.allEvidencePackages && payload.meetingId) {
        const pkgs: AgentEvidencePackage<any>[] = Object.values(payload.allEvidencePackages);
        await this.processEvidencePackages(payload.meetingId, pkgs, {
          sourceType: "Meeting",
        });
      }
    });
  }

  public async processEvidencePackages(
    sourceId: string,
    evidencePackages: AgentEvidencePackage<any>[],
    options?: { workspaceId?: string; sourceType?: "Meeting" | "Email" | "Slack" | "Document" | "CustomerCall" }
  ): Promise<ValidatedKnowledgePackage> {
    // 1. Sanitize evidence before persistence / reasoning if needed
    const sanitizedPackages: AgentEvidencePackage<any>[] = [];
    for (const pkg of evidencePackages) {
      const { sanitizedPackage } = this.privacyGuardrail.sanitize(pkg);
      sanitizedPackages.push(sanitizedPackage);

      // Append to Blackboard
      await this.repository.append(sanitizedPackage, {
        sourceId,
        workspaceId: options?.workspaceId,
        sourceType: options?.sourceType || "Meeting",
      });

      await this.eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.EVIDENCE_PUBLISHED, {
        sourceId,
        sourceType: options?.sourceType || "Meeting",
        evidencePackage: sanitizedPackage,
      });
    }

    // 2. Perform Cross-Agent Validation
    const validationReport = await this.validationEngine.validate(sourceId, sanitizedPackages);

    await this.eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.EVIDENCE_VALIDATED, {
      sourceId,
      report: validationReport,
    });

    if (validationReport.unresolvedConflicts.length > 0) {
      await this.eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.EVIDENCE_CONFLICT_DETECTED, {
        sourceId,
        report: validationReport,
        conflictsCount: validationReport.unresolvedConflicts.length,
      });
    }

    // 3. Evaluate Debate Policy
    const debateResult = await this.debateCoordinator.evaluateDebate(validationReport);

    await this.eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.DEBATE_COMPLETED, {
      sourceId,
      decision: debateResult.decision,
      rePassCapabilities: debateResult.rePassCapabilities,
      reasons: debateResult.reasons,
    });

    // 4. Generate Explainable Consensus Package
    const knowledgePackage = await this.consensusGenerator.generateConsensus(
      sourceId,
      sanitizedPackages,
      validationReport,
      options
    );

    await this.eventBus.publish(COGNITIVE_COLLABORATION_EVENTS.KNOWLEDGE_PACKAGE_PUBLISHED, {
      sourceId,
      packageId: knowledgePackage.packageId,
      knowledgePackage,
    });

    return knowledgePackage;
  }

  public getRepository(): EvidenceRepository {
    return this.repository;
  }

  public getPrivacyGuardrail(): PrivacyGuardrail {
    return this.privacyGuardrail;
  }
}
