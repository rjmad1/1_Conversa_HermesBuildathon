/**
 * Engine 10: Explainability Engine
 * Answers "Why did this appear?", "Why was this recommended?", "Why did AI prioritize this?"
 * Provides transparent explanations and instant undo/revert controls.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { AdaptiveReason, ExplainabilityTrace } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";

export class ExplainabilityEngine {
  private traces: Map<string, ExplainabilityTrace> = new Map();

  constructor(private eventBus: PlatformEventBus) {}

  public recordTrace(
    targetId: string,
    question: AdaptiveReason["question"],
    explanation: string,
    evidence: string[],
    sourceEngine: string,
    impact: string,
    confidenceScore: number,
    canUndo: boolean = true
  ): ExplainabilityTrace {
    const trace: ExplainabilityTrace = {
      id: `expl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      targetId,
      reason: {
        question,
        explanation,
        evidence,
        sourceEngine,
        impact,
        canUndo,
      },
      confidenceScore,
      timestamp: Date.now(),
    };

    this.traces.set(targetId, trace);
    this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.EXPLAINABILITY_TRACE_CREATED, { trace });

    return trace;
  }

  public getTraceForTarget(targetId: string): ExplainabilityTrace | null {
    return this.traces.get(targetId) || null;
  }

  public explainRecommendation(targetId: string): AdaptiveReason | null {
    const trace = this.traces.get(targetId);
    return trace ? trace.reason : null;
  }
}
