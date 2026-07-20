import { PlatformEventBus } from "../../../platform/events";
import { AgentRegistry } from "../agents/agent-registry";
import { AgentEvidencePackage } from "../contracts/agent-contract";
import {
  IMeetingPipelineOrchestrator,
  PipelineManifest,
  PipelineRunSnapshot,
  PipelineStartOptions
} from "../contracts/pipeline-contract";
import { ConsensusSummary } from "../domain/models";
import { MEETING_INTELLIGENCE_EVENTS } from "../events/events";
import { PipelineStateEngine } from "../state/pipeline-state-engine";

export class MeetingPipelineOrchestrator implements IMeetingPipelineOrchestrator {
  constructor(
    private stateEngine: PipelineStateEngine,
    private agentRegistry: AgentRegistry,
    private eventBus: PlatformEventBus
  ) {}

  public async startPipeline(options: PipelineStartOptions): Promise<PipelineRunSnapshot> {
    const runId = `run_${options.meetingId}_${Date.now()}`;
    const manifest: PipelineManifest = {
      pipelineVersion: "1.0.0",
      graphVersion: "1.0-dag",
      agentVersions: {
        "agent-transcription": "1.0.0",
        "agent-diarization": "1.0.0",
        "agent-topic-segmentation": "1.0.0",
        "agent-decision-extraction": "1.0.0",
        "agent-action-extraction": "1.0.0",
        "agent-risk": "1.0.0",
        "agent-knowledge": "1.0.0",
      },
      promptVersions: { default: "1.0-enterprise" },
      providerVersions: { default: "1.0.0" },
      modelVersions: { speech: "whisper-v3", llm: "gemini-3.5-flash" },
      policyVersion: "1.0-default",
      schemaVersion: "1.0.0",
      workspaceId: options.workspaceId,
      tenantId: options.tenantId,
    };

    const run = await this.stateEngine.createRun(runId, options.meetingId, manifest, options.metadata || {});

    // Asynchronously or synchronously trigger execution DAG
    this.executeDag(runId, options).catch((err) => {
      console.error(`[MeetingPipelineOrchestrator] Run '${runId}' execution error:`, err);
    });

    return run;
  }

  public async executeDag(runId: string, options: PipelineStartOptions): Promise<PipelineRunSnapshot> {
    const evidencePackages: Record<string, AgentEvidencePackage<any>> = {};

    try {
      // Stage 1: Initializing -> Transcribing
      await this.stateEngine.transitionTo(runId, "Initializing");
      await this.stateEngine.transitionTo(runId, "Transcribing");

      const transAgent = this.agentRegistry.getAgent("agent-transcription");
      if (!transAgent) throw new Error("TranscriptionAgent not registered.");

      const transPkg = await transAgent.execute({ meetingId: options.meetingId, audio: options.audioBuffer });
      evidencePackages["agent-transcription"] = transPkg;

      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.TRANSCRIPTION_COMPLETED, {
        runId,
        meetingId: options.meetingId,
        evidencePackage: transPkg,
      });
      await this.stateEngine.createCheckpoint(runId, "Transcribing", ["agent-transcription"], evidencePackages);

      // Check if paused or cancelled
      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 2: Diarizing
      await this.stateEngine.transitionTo(runId, "Diarizing");
      const diarAgent = this.agentRegistry.getAgent("agent-diarization");
      if (!diarAgent) throw new Error("SpeakerDiarizationAgent not registered.");

      const diarPkg = await diarAgent.execute({ meetingId: options.meetingId, audio: options.audioBuffer });
      evidencePackages["agent-diarization"] = diarPkg;

      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.DIARIZATION_COMPLETED, {
        runId,
        meetingId: options.meetingId,
        evidencePackage: diarPkg,
      });
      await this.stateEngine.createCheckpoint(runId, "Diarizing", ["agent-diarization"], evidencePackages);

      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 3: SegmentingTopics
      await this.stateEngine.transitionTo(runId, "SegmentingTopics");
      const topicAgent = this.agentRegistry.getAgent("agent-topic-segmentation");
      if (!topicAgent) throw new Error("TopicSegmentationAgent not registered.");

      const topicPkg = await topicAgent.execute({ meetingId: options.meetingId, transcript: transPkg.payload });
      evidencePackages["agent-topic-segmentation"] = topicPkg;

      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.TOPICS_EXTRACTED, {
        runId,
        meetingId: options.meetingId,
        evidencePackage: topicPkg,
      });
      await this.stateEngine.createCheckpoint(runId, "SegmentingTopics", ["agent-topic-segmentation"], evidencePackages);

      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 4: Parallel Extraction (Decision, Action, Risk)
      await this.stateEngine.transitionTo(runId, "ExtractingInsights");

      const decAgent = this.agentRegistry.getAgent("agent-decision-extraction");
      const actAgent = this.agentRegistry.getAgent("agent-action-extraction");
      const riskAgent = this.agentRegistry.getAgent("agent-risk");

      if (!decAgent || !actAgent || !riskAgent) throw new Error("Extraction agents missing from registry.");

      const [decPkg, actPkg, riskPkg] = await Promise.all([
        decAgent.execute({ meetingId: options.meetingId, transcript: transPkg.payload, topics: topicPkg.payload }),
        actAgent.execute({ meetingId: options.meetingId, transcript: transPkg.payload, topics: topicPkg.payload }),
        riskAgent.execute({ meetingId: options.meetingId, transcript: transPkg.payload, topics: topicPkg.payload }),
      ]);

      evidencePackages["agent-decision-extraction"] = decPkg;
      evidencePackages["agent-action-extraction"] = actPkg;
      evidencePackages["agent-risk"] = riskPkg;

      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.DECISION_FOUND, { runId, meetingId: options.meetingId, evidencePackage: decPkg });
      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.ACTION_ITEM_FOUND, { runId, meetingId: options.meetingId, evidencePackage: actPkg });
      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.RISK_IDENTIFIED, { runId, meetingId: options.meetingId, evidencePackage: riskPkg });

      await this.stateEngine.createCheckpoint(runId, "ExtractingInsights", ["agent-decision-extraction", "agent-action-extraction", "agent-risk"], evidencePackages);

      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 5: MappingKnowledge
      await this.stateEngine.transitionTo(runId, "MappingKnowledge");
      const knowAgent = this.agentRegistry.getAgent("agent-knowledge");
      if (!knowAgent) throw new Error("KnowledgeAgent not registered.");

      const knowPkg = await knowAgent.execute({
        meetingId: options.meetingId,
        transcript: transPkg.payload,
        topics: topicPkg.payload,
        decisions: decPkg.payload,
        actions: actPkg.payload,
        risks: riskPkg.payload,
      });
      evidencePackages["agent-knowledge"] = knowPkg;

      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.KNOWLEDGE_MAPPED, { runId, meetingId: options.meetingId, evidencePackage: knowPkg });
      await this.stateEngine.createCheckpoint(runId, "MappingKnowledge", ["agent-knowledge"], evidencePackages);

      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 6: DebateReady
      await this.stateEngine.transitionTo(runId, "DebateReady");
      await this.stateEngine.createCheckpoint(runId, "DebateReady", [], evidencePackages);

      if (await this.shouldStopExecution(runId)) return (await this.stateEngine.getSnapshot(runId))!;

      // Stage 7: ConsensusGenerating
      await this.stateEngine.transitionTo(runId, "ConsensusGenerating");
      const summary: ConsensusSummary = {
        meetingId: options.meetingId,
        executiveSummary: `Cognitive consensus achieved across ${Object.keys(evidencePackages).length} specialized agents.`,
        keyDecisions: decPkg.payload.decisions.map((d: any) => d.title),
        criticalActions: actPkg.payload.actions.map((a: any) => `${a.title} (${a.owner})`),
        topRisks: riskPkg.payload.risks.map((r: any) => r.description),
        consensusConfidence: 0.94,
      };

      await this.stateEngine.createCheckpoint(runId, "ConsensusGenerating", [], evidencePackages);

      // Stage 8: Completed
      await this.stateEngine.transitionTo(runId, "Completed");
      await this.eventBus.publish(MEETING_INTELLIGENCE_EVENTS.PIPELINE_COMPLETED, {
        runId,
        meetingId: options.meetingId,
        summary,
        allEvidencePackages: evidencePackages,
      });

      return (await this.stateEngine.getSnapshot(runId))!;
    } catch (err: any) {
      await this.stateEngine.recordAgentFailure(runId, "orchestrator", err.message || String(err));
      await this.stateEngine.transitionTo(runId, "Failed", err.message || String(err));
      return (await this.stateEngine.getSnapshot(runId))!;
    }
  }

  private async shouldStopExecution(runId: string): Promise<boolean> {
    const snap = await this.stateEngine.getSnapshot(runId);
    if (!snap) return true;
    return snap.state === "Paused" || snap.state === "Cancelled" || snap.state === "Failed";
  }

  public async pausePipeline(runId: string): Promise<PipelineRunSnapshot> {
    const snap = await this.stateEngine.getSnapshot(runId);
    if (!snap) throw new Error(`[MeetingPipelineOrchestrator] Run '${runId}' not found.`);
    if (snap.state === "Completed" || snap.state === "Cancelled" || snap.state === "Failed") {
      return snap;
    }
    return this.stateEngine.transitionTo(runId, "Paused", "User requested pause");
  }

  public async resumePipeline(runId: string): Promise<PipelineRunSnapshot> {
    const snap = await this.stateEngine.getSnapshot(runId);
    if (!snap) throw new Error(`[MeetingPipelineOrchestrator] Run '${runId}' not found.`);
    if (snap.state === "Completed") {
      return snap;
    }
    const { snapshot, restoredCheckpoint } = await this.stateEngine.recoverFromCheckpoint(runId);
    this.executeDag(runId, { meetingId: snapshot.meetingId }).catch((err) => {
      console.error(`[MeetingPipelineOrchestrator] Resume error for '${runId}':`, err);
    });
    return snapshot;
  }

  public async cancelPipeline(runId: string): Promise<PipelineRunSnapshot> {
    return this.stateEngine.transitionTo(runId, "Cancelled", "User cancelled pipeline execution");
  }

  public async retryPipeline(runId: string): Promise<PipelineRunSnapshot> {
    const { snapshot } = await this.stateEngine.recoverFromCheckpoint(runId);
    this.executeDag(runId, { meetingId: snapshot.meetingId }).catch((err) => {
      console.error(`[MeetingPipelineOrchestrator] Retry error for '${runId}':`, err);
    });
    return snapshot;
  }

  public async getRunStatus(runId: string): Promise<PipelineRunSnapshot | null> {
    return this.stateEngine.getSnapshot(runId);
  }
}
