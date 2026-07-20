/**
 * Engine 6: AI Confidence Layer Engine
 * Evaluates confidence, provenance, reasoning, and checks enterprise governance policy rules.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type {
  AIArtifactExplanation,
  ConfidenceBand,
  ProvenanceTrace,
} from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";

export class AIConfidenceEngine {
  constructor(private eventBus: PlatformEventBus) {}

  public evaluateArtifact(
    artifactId: string,
    confidenceScore: number,
    provenance: ProvenanceTrace[],
    reasoningSummary: string
  ): AIArtifactExplanation {
    let confidenceBand: ConfidenceBand = "Exploratory";
    if (confidenceScore >= 95) {
      confidenceBand = "High";
    } else if (confidenceScore >= 80) {
      confidenceBand = "Recommended";
    } else if (confidenceScore >= 60) {
      confidenceBand = "Review";
    }

    const isGovernanceCompliant = confidenceScore >= 60 && provenance.length > 0;

    const explanation: AIArtifactExplanation = {
      artifactId,
      confidenceScore,
      confidenceBand,
      provenance,
      reasoningSummary,
      verificationStatus: isGovernanceCompliant ? "verified" : "unverified",
      approvalState: confidenceScore >= 95 ? "approved" : "pending",
      isGovernanceCompliant,
    };

    this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.CONFIDENCE_EVALUATED, {
      explanation,
    });

    return explanation;
  }
}
