import { PlatformEventBus } from "../../../platform/events";
import { AgentEvidencePackage } from "../contracts/agent-contract";
import {
  IPipelineStateRepository,
  PipelineCheckpoint,
  PipelineManifest,
  PipelineRunSnapshot,
  PipelineStage
} from "../contracts/pipeline-contract";
import { MEETING_INTELLIGENCE_EVENTS } from "../events/events";
import { PipelineStateMachine } from "./pipeline-state-machine";

export class PipelineStateEngine {
  constructor(
    private repository: IPipelineStateRepository,
    private eventBus: PlatformEventBus
  ) {}

  public async createRun(
    runId: string,
    meetingId: string,
    manifest: PipelineManifest,
    metadata: Record<string, unknown> = {}
  ): Promise<PipelineRunSnapshot> {
    const now = Date.now();
    const snapshot: PipelineRunSnapshot = {
      runId,
      meetingId,
      manifest,
      state: "Queued",
      activeStage: "Queued",
      completedAgents: [],
      failedAgents: {},
      checkpoints: [],
      retryCount: 0,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.saveSnapshot(snapshot);
    await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.MEETING_UPLOADED, {
      runId,
      meetingId,
    });

    return snapshot;
  }

  public async transitionTo(
    runId: string,
    targetStage: PipelineStage,
    reason?: string
  ): Promise<PipelineRunSnapshot> {
    const snapshot = await this.repository.loadSnapshot(runId);
    if (!snapshot) throw new Error(`[PipelineStateEngine] Pipeline run '${runId}' not found.`);

    PipelineStateMachine.validateTransition(snapshot.state, targetStage);

    snapshot.state = targetStage;
    snapshot.activeStage = targetStage;
    snapshot.updatedAt = Date.now();

    await this.repository.saveSnapshot(snapshot);

    if (targetStage === "Paused") {
      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.PIPELINE_PAUSED, {
        runId,
        meetingId: snapshot.meetingId,
        stage: targetStage,
        reason,
      });
    } else if (targetStage === "Failed") {
      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.PIPELINE_FAILED, {
        runId,
        meetingId: snapshot.meetingId,
        stage: targetStage,
        error: reason,
      });
    }

    return snapshot;
  }

  public async createCheckpoint(
    runId: string,
    stage: PipelineStage,
    completedAgentIds: string[],
    evidencePackages: Record<string, AgentEvidencePackage<any>>
  ): Promise<PipelineCheckpoint> {
    const snapshot = await this.repository.loadSnapshot(runId);
    if (!snapshot) throw new Error(`[PipelineStateEngine] Run '${runId}' not found.`);

    const completedAgentIdsSet = Array.from(new Set([...snapshot.completedAgents, ...completedAgentIds]));
    snapshot.completedAgents = completedAgentIdsSet;

    const checkpointId = `chk_${runId}_${stage}_${Date.now()}`;
    const checkpoint: PipelineCheckpoint = {
      checkpointId,
      stage,
      completedAgentIds: completedAgentIdsSet,
      evidencePackages,
      timestamp: Date.now(),
      hash: `hash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    snapshot.checkpoints.push(checkpoint);
    snapshot.latestCheckpoint = checkpoint;
    snapshot.updatedAt = Date.now();

    await this.repository.saveSnapshot(snapshot);
    await this.repository.persistCheckpoint(runId, checkpoint);

    await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.CHECKPOINT_CREATED, {
      runId,
      meetingId: snapshot.meetingId,
      checkpoint,
    });

    return checkpoint;
  }

  public async recoverFromCheckpoint(runId: string): Promise<{
    snapshot: PipelineRunSnapshot;
    restoredCheckpoint: PipelineCheckpoint | null;
  }> {
    let snapshot = await this.repository.loadSnapshot(runId);
    if (!snapshot) throw new Error(`[PipelineStateEngine] Run '${runId}' not found.`);

    snapshot = await this.transitionTo(runId, "Recovering", "Initiating checkpoint recovery");

    const checkpoint = await this.repository.restoreLatestCheckpoint(runId);
    if (checkpoint) {
      snapshot.completedAgents = [...checkpoint.completedAgentIds];
      snapshot.activeStage = checkpoint.stage;
      await this.repository.saveSnapshot(snapshot);
      await this.transitionTo(runId, checkpoint.stage, "Restored from checkpoint");
    } else {
      await this.transitionTo(runId, "Initializing", "No checkpoint found, restarting from Initializing");
    }

    const updated = (await this.repository.loadSnapshot(runId))!;
    return { snapshot: updated, restoredCheckpoint: checkpoint };
  }

  public async recordAgentFailure(
    runId: string,
    agentId: string,
    errorMessage: string
  ): Promise<PipelineRunSnapshot> {
    const snapshot = await this.repository.loadSnapshot(runId);
    if (!snapshot) throw new Error(`[PipelineStateEngine] Run '${runId}' not found.`);

    snapshot.failedAgents[agentId] = errorMessage;
    snapshot.retryCount += 1;
    snapshot.updatedAt = Date.now();

    await this.repository.saveSnapshot(snapshot);
    return snapshot;
  }

  public async getSnapshot(runId: string): Promise<PipelineRunSnapshot | null> {
    return this.repository.loadSnapshot(runId);
  }
}
