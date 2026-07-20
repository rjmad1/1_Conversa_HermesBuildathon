import { PlatformEventBus, PlatformEvent } from "../../../../platform/events";
import { AgentEvidencePackage } from "../../../meeting-intelligence/contracts/agent-contract";
import { CognitiveCollaborationService } from "../../application/cognitive-collaboration-service";
import { EvidenceRepository } from "../../repository/evidence-repository";
import { PrivacyGuardrail } from "../../services/privacy-guardrail";
import { CrossAgentValidationEngine } from "../../services/cross-agent-validation-engine";
import { DebateCoordinator } from "../../services/debate-coordinator";
import { ConsensusGenerator } from "../../services/consensus-generator";
import { COGNITIVE_COLLABORATION_EVENTS } from "../../events/events";

export async function runCollaborationPipelineIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  try {
    const eventBus = new PlatformEventBus();
    const repository = new EvidenceRepository();
    const guardrail = new PrivacyGuardrail();
    const valEngine = new CrossAgentValidationEngine();
    const debateCoordinator = new DebateCoordinator();
    const consensusGen = new ConsensusGenerator();

    const service = new CognitiveCollaborationService(
      repository,
      guardrail,
      valEngine,
      debateCoordinator,
      consensusGen,
      eventBus
    );

    let publishedPackageId: string | null = null;
    eventBus.subscribe(COGNITIVE_COLLABORATION_EVENTS.KNOWLEDGE_PACKAGE_PUBLISHED, (evt: PlatformEvent<any>) => {
      publishedPackageId = (evt.payload as any)?.packageId || null;
    });

    const mockEvidencePackages: AgentEvidencePackage<any>[] = [
      {
        packageId: "pkg_dec_1",
        agentId: "agent-decision-extraction",
        agentName: "DecisionExtractionAgent",
        agentVersion: "1.0.0",
        meetingId: "meeting_collab_101",
        status: "Success",
        payload: {
          decisions: [{ title: "Adopt Tailwind for design system", topic: "Frontend Architecture", owner: "Sarah" }],
        },
        overallConfidence: 0.92,
        evidence: [
          {
            id: "ev_dec_1",
            meetingId: "meeting_collab_101",
            speakerName: "Sarah",
            verbatimQuote: "We agree to adopt Tailwind CSS with API key api_key='sk_live_1122334455667788'.",
          },
        ],
        reasoning: { extractionStrategy: "llm", provider: "google", model: "gemini-3.5-flash", promptVersion: "1.0", executionDurationMs: 150 },
        governance: { validationStatus: "Validated", privacyClassification: "Confidential", policyCompliance: true, reviewRequired: false },
        quality: { ambiguityScore: 0.05, completenessScore: 0.95, consistencyScore: 0.95 },
        confidenceDistribution: { sourceConfidence: 0.9, modelConfidence: 0.95, evidenceStrength: 0.9, crossAgentAgreement: 0.9, validationConfidence: 0.9, overall: 0.92 },
        createdAt: Date.now(),
      },
      {
        packageId: "pkg_act_1",
        agentId: "agent-action-extraction",
        agentName: "ActionExtractionAgent",
        agentVersion: "1.0.0",
        meetingId: "meeting_collab_101",
        status: "Success",
        payload: {
          actions: [{ title: "Update index.css and color tokens", owner: "Sarah", priority: "High" }],
        },
        overallConfidence: 0.88,
        evidence: [
          { id: "ev_act_1", meetingId: "meeting_collab_101", speakerName: "Sarah", verbatimQuote: "I will update index.css tomorrow." },
        ],
        reasoning: { extractionStrategy: "llm", provider: "google", model: "gemini-3.5-flash", promptVersion: "1.0", executionDurationMs: 120 },
        governance: { validationStatus: "Validated", privacyClassification: "Internal", policyCompliance: true, reviewRequired: false },
        quality: { ambiguityScore: 0.1, completenessScore: 0.9, consistencyScore: 0.9 },
        confidenceDistribution: { sourceConfidence: 0.88, modelConfidence: 0.88, evidenceStrength: 0.88, crossAgentAgreement: 0.88, validationConfidence: 0.88, overall: 0.88 },
        createdAt: Date.now(),
      },
    ];

    // Execute service processing
    const vkp = await service.processEvidencePackages("meeting_collab_101", mockEvidencePackages, {
      workspaceId: "ws_conversa",
      sourceType: "Meeting",
    });

    if (!vkp || vkp.packageId !== publishedPackageId) {
      throw new Error(`Event publication mismatch: Event emitted packageId '${publishedPackageId}', returned '${vkp?.packageId}'`);
    }

    if (vkp.decisions.length !== 1 || vkp.decisions[0]!.title !== "Adopt Tailwind for design system") {
      throw new Error("Integrated consensus decision output failed verification");
    }

    // Check evidence blackboard store
    const storedPackages = await repository.filter({ meetingId: "meeting_collab_101" });
    if (storedPackages.length !== 2) {
      throw new Error(`Expected 2 packages stored in EvidenceRepository, got ${storedPackages.length}`);
    }

    // Verify privacy sanitization occurred prior to blackboard storage
    const storedStr = JSON.stringify(storedPackages);
    if (storedStr.includes("sk_live_1122334455667788")) {
      throw new Error("Raw API secret was persisted in EvidenceRepository blackboard!");
    }

    results.push({ name: "Integration: End-to-End Cognitive Collaboration Engine Pipeline", passed: true });
  } catch (err: any) {
    results.push({ name: "Integration: End-to-End Cognitive Collaboration Engine Pipeline", passed: false, error: err.message });
  }

  return results;
}
