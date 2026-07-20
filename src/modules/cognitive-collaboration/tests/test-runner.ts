import { runEvidenceRepositoryUnitTests } from "./unit/evidence-repository.test";
import { runPrivacyGuardrailUnitTests } from "./unit/privacy-guardrail.test";
import { runValidationAndDebateUnitTests } from "./unit/validation-and-debate.test";
import { runConsensusGeneratorUnitTests } from "./unit/consensus-generator.test";
import { runCollaborationPipelineIntegrationTests } from "./integration/collaboration-pipeline.test";
import { runArchitectureBoundaryTests } from "./architecture/boundary.test";

export async function runAllPhase2Tests(): Promise<boolean> {
  console.log("===============================================================");
  console.log("    Cognitive Collaboration Engine (Phase 2) Test Runner       ");
  console.log("===============================================================\n");

  const suites = [
    { category: "Unit: Evidence Repository", runner: runEvidenceRepositoryUnitTests },
    { category: "Unit: Privacy Guardrail", runner: runPrivacyGuardrailUnitTests },
    { category: "Unit: Validation & Debate", runner: runValidationAndDebateUnitTests },
    { category: "Unit: Consensus Generator", runner: runConsensusGeneratorUnitTests },
    { category: "Integration: Collaboration Pipeline", runner: runCollaborationPipelineIntegrationTests },
    { category: "Architecture: Boundaries & Seams", runner: runArchitectureBoundaryTests },
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

runAllPhase2Tests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Phase 2 test runner encountered fatal error:", err);
    process.exit(1);
  });
