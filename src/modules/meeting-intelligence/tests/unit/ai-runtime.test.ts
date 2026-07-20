import { AIRuntime } from "../../provider/ai-runtime";
import { CapabilityRouter } from "../../provider/capability-router";
import { MockLLMProvider, MockSpeechProvider } from "../../provider/mock-providers";

export async function runAIRuntimeUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Provider Registration & Capabilities
  try {
    const runtime = new AIRuntime();
    const speech = new MockSpeechProvider();
    const llm = new MockLLMProvider();

    runtime.registerProvider(speech);
    runtime.registerProvider(llm);

    const providers = runtime.getRegisteredProviders();
    if (providers.length === 2) {
      results.push({ name: "AIRuntime Provider Registration & Discovery", passed: true });
    } else {
      results.push({ name: "AIRuntime Provider Registration & Discovery", passed: false, error: "Provider registration count mismatch" });
    }
  } catch (err: any) {
    results.push({ name: "AIRuntime Provider Registration & Discovery", passed: false, error: err.message });
  }

  // Test 2: Capability Router Selection
  try {
    const router = new CapabilityRouter();
    const speech = new MockSpeechProvider();
    const llm = new MockLLMProvider();

    const decision = router.selectProvider(
      { capability: "SpeechTranscription", qualityTier: "Balanced", payload: {} },
      [speech, llm]
    );

    if (decision.selectedProviderId === speech.id) {
      results.push({ name: "CapabilityRouter Speech Capability Selection", passed: true });
    } else {
      results.push({ name: "CapabilityRouter Speech Capability Selection", passed: false, error: "Wrong provider selected" });
    }
  } catch (err: any) {
    results.push({ name: "CapabilityRouter Speech Capability Selection", passed: false, error: err.message });
  }

  // Test 3: Failover Execution
  try {
    const runtime = new AIRuntime();
    runtime.registerProvider(new MockSpeechProvider());
    runtime.registerProvider(new MockLLMProvider());

    const res = await runtime.executeWithFailover({
      capability: "TopicSegmentation",
      qualityTier: "Balanced",
      payload: { meetingId: "m-failover-test" },
    });

    if (res && res.data) {
      results.push({ name: "AIRuntime Capability Failover Execution", passed: true });
    } else {
      results.push({ name: "AIRuntime Capability Failover Execution", passed: false, error: "Failover execution returned no data" });
    }
  } catch (err: any) {
    results.push({ name: "AIRuntime Capability Failover Execution", passed: false, error: err.message });
  }

  return results;
}
