import { AIRuntime } from "../../provider/ai-runtime";
import { MockLLMProvider, MockSpeechProvider } from "../../provider/mock-providers";
import { TranscriptionAgent } from "../../agents/transcription-agent";
import { SpeakerDiarizationAgent } from "../../agents/diarization-agent";
import { TopicSegmentationAgent } from "../../agents/topic-segmentation-agent";
import { DecisionExtractionAgent } from "../../agents/decision-extraction-agent";
import { ActionExtractionAgent } from "../../agents/action-extraction-agent";
import { RiskAgent } from "../../agents/risk-agent";
import { KnowledgeAgent } from "../../agents/knowledge-agent";

export async function runAgentUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const runtime = new AIRuntime();
  runtime.registerProvider(new MockSpeechProvider());
  runtime.registerProvider(new MockLLMProvider());

  const testMeetingId = "m-test-101";

  // Test 1: TranscriptionAgent
  try {
    const agent = new TranscriptionAgent(runtime);
    const pkg = await agent.execute({ meetingId: testMeetingId, audio: "test_audio" });
    if (
      pkg.status === "Success" &&
      pkg.agentId === "agent-transcription" &&
      pkg.evidence.length > 0 &&
      pkg.overallConfidence > 0.9 &&
      pkg.governance.privacyClassification === "Internal"
    ) {
      results.push({ name: "TranscriptionAgent Evidence Package Generation", passed: true });
    } else {
      results.push({ name: "TranscriptionAgent Evidence Package Generation", passed: false, error: "Invalid package structure" });
    }
  } catch (err: any) {
    results.push({ name: "TranscriptionAgent Evidence Package Generation", passed: false, error: err.message });
  }

  // Test 2: SpeakerDiarizationAgent
  try {
    const agent = new SpeakerDiarizationAgent(runtime);
    const pkg = await agent.execute({ meetingId: testMeetingId, audio: "test_audio" });
    if (pkg.payload.timeline.length === 3 && pkg.payload.speakers.length === 3) {
      results.push({ name: "SpeakerDiarizationAgent Timeline Generation", passed: true });
    } else {
      results.push({ name: "SpeakerDiarizationAgent Timeline Generation", passed: false, error: "Timeline count mismatch" });
    }
  } catch (err: any) {
    results.push({ name: "SpeakerDiarizationAgent Timeline Generation", passed: false, error: err.message });
  }

  // Test 3: TopicSegmentationAgent
  try {
    const transAgent = new TranscriptionAgent(runtime);
    const transPkg = await transAgent.execute({ meetingId: testMeetingId, audio: "test_audio" });

    const agent = new TopicSegmentationAgent(runtime);
    const pkg = await agent.execute({ meetingId: testMeetingId, transcript: transPkg.payload });
    if (pkg.payload.topics.length >= 2) {
      results.push({ name: "TopicSegmentationAgent Topic Extraction", passed: true });
    } else {
      results.push({ name: "TopicSegmentationAgent Topic Extraction", passed: false, error: "Insufficient topics" });
    }
  } catch (err: any) {
    results.push({ name: "TopicSegmentationAgent Topic Extraction", passed: false, error: err.message });
  }

  // Test 4: Decision, Action, Risk Extraction Agents
  try {
    const transAgent = new TranscriptionAgent(runtime);
    const transPkg = await transAgent.execute({ meetingId: testMeetingId, audio: "test_audio" });

    const decAgent = new DecisionExtractionAgent(runtime);
    const actAgent = new ActionExtractionAgent(runtime);
    const riskAgent = new RiskAgent(runtime);

    const [decPkg, actPkg, riskPkg] = await Promise.all([
      decAgent.execute({ meetingId: testMeetingId, transcript: transPkg.payload }),
      actAgent.execute({ meetingId: testMeetingId, transcript: transPkg.payload }),
      riskAgent.execute({ meetingId: testMeetingId, transcript: transPkg.payload }),
    ]);

    if (decPkg.payload.decisions.length > 0 && actPkg.payload.actions.length > 0 && riskPkg.payload.risks.length > 0) {
      results.push({ name: "Parallel Extraction Agents (Decision, Action, Risk)", passed: true });
    } else {
      results.push({ name: "Parallel Extraction Agents (Decision, Action, Risk)", passed: false, error: "Extraction failed" });
    }
  } catch (err: any) {
    results.push({ name: "Parallel Extraction Agents (Decision, Action, Risk)", passed: false, error: err.message });
  }

  // Test 5: KnowledgeAgent
  try {
    const transAgent = new TranscriptionAgent(runtime);
    const transPkg = await transAgent.execute({ meetingId: testMeetingId, audio: "test_audio" });

    const agent = new KnowledgeAgent(runtime);
    const pkg = await agent.execute({ meetingId: testMeetingId, transcript: transPkg.payload });
    if (pkg.payload.mappings.length > 0 && pkg.evidence.length > 0) {
      results.push({ name: "KnowledgeAgent Mapping & Provenance", passed: true });
    } else {
      results.push({ name: "KnowledgeAgent Mapping & Provenance", passed: false, error: "Missing mappings or provenance" });
    }
  } catch (err: any) {
    results.push({ name: "KnowledgeAgent Mapping & Provenance", passed: false, error: err.message });
  }

  return results;
}
