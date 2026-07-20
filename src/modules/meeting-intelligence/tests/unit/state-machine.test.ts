import { PlatformEventBus } from "../../../../platform/events";
import { PipelineStateMachine } from "../../state/pipeline-state-machine";
import { PipelineStateEngine } from "../../state/pipeline-state-engine";
import { InMemoryPipelineStateRepository } from "../../state/repository";
import { PipelineManifest } from "../../contracts/pipeline-contract";

export async function runStateMachineUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: State Machine Transition Validator
  try {
    const valid = PipelineStateMachine.canTransition("Queued", "Initializing");
    const invalid = PipelineStateMachine.canTransition("Queued", "Completed");

    if (valid && !invalid) {
      results.push({ name: "PipelineStateMachine Transition Validation Matrix", passed: true });
    } else {
      results.push({ name: "PipelineStateMachine Transition Validation Matrix", passed: false, error: "Validation logic failed" });
    }
  } catch (err: any) {
    results.push({ name: "PipelineStateMachine Transition Validation Matrix", passed: false, error: err.message });
  }

  // Test 2: PipelineStateEngine Creation & Transition
  try {
    const eventBus = new PlatformEventBus();
    const repo = new InMemoryPipelineStateRepository();
    const engine = new PipelineStateEngine(repo, eventBus);

    const manifest: PipelineManifest = {
      pipelineVersion: "1.0.0",
      graphVersion: "1.0-dag",
      agentVersions: {},
      promptVersions: {},
      providerVersions: {},
      modelVersions: {},
      policyVersion: "1.0",
      schemaVersion: "1.0",
    };

    const run = await engine.createRun("run_sm_1", "m_sm_1", manifest);
    if (run.state === "Queued") {
      await engine.transitionTo(run.runId, "Initializing");
      await engine.transitionTo(run.runId, "Transcribing");
      const updated = await engine.getSnapshot(run.runId);
      if (updated?.state === "Transcribing") {
        results.push({ name: "PipelineStateEngine Event-Sourced Lifecycle Transitions", passed: true });
      } else {
        results.push({ name: "PipelineStateEngine Event-Sourced Lifecycle Transitions", passed: false, error: "State mismatch" });
      }
    } else {
      results.push({ name: "PipelineStateEngine Event-Sourced Lifecycle Transitions", passed: false, error: "Initial state not Queued" });
    }
  } catch (err: any) {
    results.push({ name: "PipelineStateEngine Event-Sourced Lifecycle Transitions", passed: false, error: err.message });
  }

  // Test 3: Checkpointing & Recovery
  try {
    const eventBus = new PlatformEventBus();
    const repo = new InMemoryPipelineStateRepository();
    const engine = new PipelineStateEngine(repo, eventBus);

    const manifest: PipelineManifest = {
      pipelineVersion: "1.0.0",
      graphVersion: "1.0-dag",
      agentVersions: {},
      promptVersions: {},
      providerVersions: {},
      modelVersions: {},
      policyVersion: "1.0",
      schemaVersion: "1.0",
    };

    const run = await engine.createRun("run_sm_2", "m_sm_2", manifest);
    await engine.transitionTo(run.runId, "Initializing");
    await engine.transitionTo(run.runId, "Transcribing");

    await engine.createCheckpoint(run.runId, "Transcribing", ["agent-transcription"], {});

    // Simulate failure
    await engine.recordAgentFailure(run.runId, "test-agent", "Simulated timeout");
    await engine.transitionTo(run.runId, "Failed", "Simulated timeout");

    // Recover
    const { snapshot, restoredCheckpoint } = await engine.recoverFromCheckpoint(run.runId);

    if (restoredCheckpoint && restoredCheckpoint.stage === "Transcribing" && snapshot.completedAgents.includes("agent-transcription")) {
      results.push({ name: "PipelineStateEngine Checkpoint Persistence & Recovery", passed: true });
    } else {
      results.push({ name: "PipelineStateEngine Checkpoint Persistence & Recovery", passed: false, error: "Checkpoint recovery failed" });
    }
  } catch (err: any) {
    results.push({ name: "PipelineStateEngine Checkpoint Persistence & Recovery", passed: false, error: err.message });
  }

  return results;
}
