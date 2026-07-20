import { PipelineStage } from "../contracts/pipeline-contract";

export class PipelineStateMachine {
  private static VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
    Queued: ["Initializing", "Cancelled", "Failed"],
    Initializing: ["Transcribing", "Paused", "Cancelled", "Failed"],
    Transcribing: ["Diarizing", "Paused", "Cancelled", "Failed"],
    Diarizing: ["SegmentingTopics", "Paused", "Cancelled", "Failed"],
    SegmentingTopics: ["ExtractingInsights", "Paused", "Cancelled", "Failed"],
    ExtractingInsights: ["MappingKnowledge", "Paused", "Cancelled", "Failed"],
    MappingKnowledge: ["DebateReady", "Paused", "Cancelled", "Failed"],
    DebateReady: ["ConsensusGenerating", "Paused", "Cancelled", "Failed"],
    ConsensusGenerating: ["Completed", "Paused", "Cancelled", "Failed"],
    Completed: [],
    Paused: [
      "Transcribing",
      "Diarizing",
      "SegmentingTopics",
      "ExtractingInsights",
      "MappingKnowledge",
      "DebateReady",
      "ConsensusGenerating",
      "Recovering",
      "Cancelled"
    ],
    Cancelled: [],
    Failed: ["Recovering", "Cancelled"],
    Recovering: [
      "Initializing",
      "Transcribing",
      "Diarizing",
      "SegmentingTopics",
      "ExtractingInsights",
      "MappingKnowledge",
      "DebateReady",
      "ConsensusGenerating",
      "Failed",
      "Cancelled"
    ],
  };

  public static canTransition(from: PipelineStage, to: PipelineStage): boolean {
    if (from === to) return true;
    const allowed = this.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static validateTransition(from: PipelineStage, to: PipelineStage): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `[PipelineStateMachine] Invalid transition from '${from}' to '${to}'.`
      );
    }
  }
}
