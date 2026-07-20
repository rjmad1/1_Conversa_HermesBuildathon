import { PlatformEventBus } from "../../../platform/events";
import { AgentRegistry } from "../agents/agent-registry";
import { ActionExtractionAgent } from "../agents/action-extraction-agent";
import { DecisionExtractionAgent } from "../agents/decision-extraction-agent";
import { SpeakerDiarizationAgent } from "../agents/diarization-agent";
import { KnowledgeAgent } from "../agents/knowledge-agent";
import { RiskAgent } from "../agents/risk-agent";
import { TopicSegmentationAgent } from "../agents/topic-segmentation-agent";
import { TranscriptionAgent } from "../agents/transcription-agent";
import { IMeetingPipelineFacade, PipelineRunSnapshot, PipelineStartOptions } from "../contracts/pipeline-contract";
import { MeetingPipelineOrchestrator } from "../orchestration/dag-orchestrator";
import { AIRuntime } from "../provider/ai-runtime";
import { MockLLMProvider, MockSpeechProvider } from "../provider/mock-providers";
import { PipelineStateEngine } from "../state/pipeline-state-engine";
import { InMemoryPipelineStateRepository } from "../state/repository";

export class MeetingPipelineFacade implements IMeetingPipelineFacade {
  private eventBus: PlatformEventBus;
  private stateEngine: PipelineStateEngine;
  private agentRegistry: AgentRegistry;
  private aiRuntime: AIRuntime;
  private orchestrator: MeetingPipelineOrchestrator;

  constructor(customEventBus?: PlatformEventBus) {
    this.eventBus = customEventBus || new PlatformEventBus();
    const repo = new InMemoryPipelineStateRepository();
    this.stateEngine = new PipelineStateEngine(repo, this.eventBus);

    this.aiRuntime = new AIRuntime();
    this.aiRuntime.registerProvider(new MockSpeechProvider());
    this.aiRuntime.registerProvider(new MockLLMProvider());

    this.agentRegistry = new AgentRegistry();
    this.agentRegistry.register(new TranscriptionAgent(this.aiRuntime));
    this.agentRegistry.register(new SpeakerDiarizationAgent(this.aiRuntime));
    this.agentRegistry.register(new TopicSegmentationAgent(this.aiRuntime));
    this.agentRegistry.register(new DecisionExtractionAgent(this.aiRuntime));
    this.agentRegistry.register(new ActionExtractionAgent(this.aiRuntime));
    this.agentRegistry.register(new RiskAgent(this.aiRuntime));
    this.agentRegistry.register(new KnowledgeAgent(this.aiRuntime));

    this.orchestrator = new MeetingPipelineOrchestrator(this.stateEngine, this.agentRegistry, this.eventBus);
  }

  public async processMeeting(options: PipelineStartOptions): Promise<PipelineRunSnapshot> {
    const run = await this.orchestrator.startPipeline(options);
    // Wait for initial DAG step or completion in facade helper
    return this.orchestrator.executeDag(run.runId, options);
  }

  public async pauseProcessing(runId: string): Promise<PipelineRunSnapshot> {
    return this.orchestrator.pausePipeline(runId);
  }

  public async resumeProcessing(runId: string): Promise<PipelineRunSnapshot> {
    return this.orchestrator.resumePipeline(runId);
  }

  public async cancelProcessing(runId: string): Promise<PipelineRunSnapshot> {
    return this.orchestrator.cancelPipeline(runId);
  }

  public async retryProcessing(runId: string): Promise<PipelineRunSnapshot> {
    return this.orchestrator.retryPipeline(runId);
  }

  public async getProcessingStatus(runId: string): Promise<PipelineRunSnapshot | null> {
    return this.orchestrator.getRunStatus(runId);
  }

  public getEventBus(): PlatformEventBus {
    return this.eventBus;
  }

  public getAIRuntime(): AIRuntime {
    return this.aiRuntime;
  }

  public getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }
}
