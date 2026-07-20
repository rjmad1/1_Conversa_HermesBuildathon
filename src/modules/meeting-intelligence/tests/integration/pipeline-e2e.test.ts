import { MeetingPipelineFacade } from "../../application/pipeline-facade";

export async function runPipelineIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Full Synthetic Meeting Pipeline E2E Execution
  try {
    const facade = new MeetingPipelineFacade();
    const meetingId = "m-synthetic-e2e-1";

    const eventsEmitted: string[] = [];
    facade.getEventBus().subscribe("*", (evt) => {
      eventsEmitted.push(evt.type);
    });

    const runSnapshot = await facade.processMeeting({
      meetingId,
      audioBuffer: "synthetic_audio_payload",
      workspaceId: "ws_conversa_main",
    });

    if (
      runSnapshot.state === "Completed" &&
      runSnapshot.completedAgents.length >= 7 &&
      runSnapshot.checkpoints.length >= 6
    ) {
      results.push({ name: "End-to-End Synthetic Meeting Pipeline Execution", passed: true });
    } else {
      results.push({
        name: "End-to-End Synthetic Meeting Pipeline Execution",
        passed: false,
        error: `Expected Completed state, got ${runSnapshot.state}. Completed agents: ${runSnapshot.completedAgents.length}`,
      });
    }
  } catch (err: any) {
    results.push({ name: "End-to-End Synthetic Meeting Pipeline Execution", passed: false, error: err.message });
  }

  // Test 2: Pause, Resume & Checkpoint Restoration Lifecycle
  try {
    const facade = new MeetingPipelineFacade();
    const meetingId = "m-lifecycle-test";

    const run = await facade.processMeeting({ meetingId });
    const paused = await facade.pauseProcessing(run.runId);

    if (paused.state === "Completed" || paused.state === "Paused") {
      const resumed = await facade.resumeProcessing(run.runId);
      if (resumed.state === "Completed" || resumed.state === "SegmentingTopics" || resumed.state === "Diarizing" || resumed.state === "Transcribing") {
        results.push({ name: "Pipeline Pause, Resume & Checkpoint Restoration Lifecycle", passed: true });
      } else {
        results.push({ name: "Pipeline Pause, Resume & Checkpoint Restoration Lifecycle", passed: false, error: `Resumed state unexpected: ${resumed.state}` });
      }
    } else {
      results.push({ name: "Pipeline Pause, Resume & Checkpoint Restoration Lifecycle", passed: false, error: `Pause failed, state: ${paused.state}` });
    }
  } catch (err: any) {
    results.push({ name: "Pipeline Pause, Resume & Checkpoint Restoration Lifecycle", passed: false, error: err.message });
  }

  return results;
}
