import { runAgentUnitTests } from "./unit/agents.test";
import { runStateMachineUnitTests } from "./unit/state-machine.test";
import { runAIRuntimeUnitTests } from "./unit/ai-runtime.test";
import { runPipelineIntegrationTests } from "./integration/pipeline-e2e.test";
import { runArchitectureBoundaryTests } from "./architecture/boundary.test";

export async function runAllTests(): Promise<boolean> {
  console.log("===============================================================");
  console.log("  Enterprise Cognitive Meeting Pipeline (Phase 1) Test Runner  ");
  console.log("===============================================================\n");

  const suites = [
    { category: "Unit: Agents", runner: runAgentUnitTests },
    { category: "Unit: State Machine", runner: runStateMachineUnitTests },
    { category: "Unit: AI Runtime", runner: runAIRuntimeUnitTests },
    { category: "Integration: E2E Pipeline", runner: runPipelineIntegrationTests },
    { category: "Architecture: Boundaries", runner: runArchitectureBoundaryTests },
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    console.log(`--- [Suite] ${suite.category} ---`);
    const results = await suite.runner();

    for (const res of results) {
      totalTests++;
      if (res.passed) {
        totalPassed++;
        console.log(`  ✓ PASSED: ${res.name}`);
      } else {
        totalFailed++;
        console.log(`  ✗ FAILED: ${res.name} -> Error: ${res.error}`);
      }
    }
    console.log("");
  }

  console.log("===============================================================");
  console.log(`SUMMARY: Total Tests: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log("===============================================================");

  return totalFailed === 0;
}

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Test runner encountered fatal error:", err);
    process.exit(1);
  });
