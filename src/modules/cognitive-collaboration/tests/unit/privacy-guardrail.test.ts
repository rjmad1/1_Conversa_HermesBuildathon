import { AgentEvidencePackage } from "../../../meeting-intelligence/contracts/agent-contract";
import { PrivacyGuardrail } from "../../services/privacy-guardrail";

export async function runPrivacyGuardrailUnitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const createSensitivePkg = (): AgentEvidencePackage<any> => ({
    packageId: "pkg_sensitive",
    agentId: "agent-transcription",
    agentName: "TranscriptionAgent",
    agentVersion: "1.0.0",
    meetingId: "m_1",
    status: "Success",
    payload: {
      text: "User john.doe@acme.com agreed to pay $50,000 USD. Secret api_key='sk_live_998877665544332211'. Customer CUST-9988.",
    },
    overallConfidence: 0.95,
    evidence: [
      {
        id: "ev_1",
        meetingId: "m_1",
        speakerName: "John Doe",
        verbatimQuote: "My email is john.doe@acme.com and SSN is 123-45-6789.",
      },
    ],
    reasoning: {
      extractionStrategy: "whisper",
      provider: "openai",
      model: "whisper-v3",
      promptVersion: "1.0",
      executionDurationMs: 200,
    },
    governance: {
      validationStatus: "Validated",
      privacyClassification: "Confidential",
      policyCompliance: true,
      reviewRequired: false,
    },
    quality: { ambiguityScore: 0.05, completenessScore: 0.95, consistencyScore: 0.95 },
    confidenceDistribution: {
      sourceConfidence: 0.95,
      modelConfidence: 0.95,
      evidenceStrength: 0.95,
      crossAgentAgreement: 0.95,
      validationConfidence: 0.95,
      overall: 0.95,
    },
    createdAt: Date.now(),
  });

  // Test 1: Classification
  try {
    const guardrail = new PrivacyGuardrail();
    const classification = guardrail.classify("Call me at 555-123-4567 or email dev@acme.com with api_key='sk_live_1234567890abcdef'.");
    if (classification.sensitivity !== "Restricted" || !classification.detectedPatterns.includes("API_KEY")) {
      throw new Error(`Unexpected classification: ${JSON.stringify(classification)}`);
    }
    results.push({ name: "PrivacyGuardrail: Classification Engine", passed: true });
  } catch (err: any) {
    results.push({ name: "PrivacyGuardrail: Classification Engine", passed: false, error: err.message });
  }

  // Test 2: Sanitize and Token Vault
  try {
    const guardrail = new PrivacyGuardrail();
    const pkg = createSensitivePkg();
    const { sanitizedPackage, tokenMapCount } = guardrail.sanitize(pkg, "EU");

    if (tokenMapCount < 3) {
      throw new Error(`Expected at least 3 sensitive tokens, got ${tokenMapCount}`);
    }

    const sanitizedStr = JSON.stringify(sanitizedPackage);
    if (sanitizedStr.includes("john.doe@acme.com") || sanitizedStr.includes("123-45-6789") || sanitizedStr.includes("sk_live_998877665544332211")) {
      throw new Error("Sanitized package still contains raw sensitive data!");
    }

    if (!sanitizedStr.includes("[TOKEN_EMAIL_") || !sanitizedStr.includes("[TOKEN_API_KEY_")) {
      throw new Error("Sanitized package does not contain expected secure tokens.");
    }

    results.push({ name: "PrivacyGuardrail: Sanitize & Reversible Token Vault", passed: true });
  } catch (err: any) {
    results.push({ name: "PrivacyGuardrail: Sanitize & Reversible Token Vault", passed: false, error: err.message });
  }

  // Test 3: Restore Roundtrip
  try {
    const guardrail = new PrivacyGuardrail();
    const pkg = createSensitivePkg();
    const { sanitizedPackage } = guardrail.sanitize(pkg);
    const { restoredPackage, restoredCount } = guardrail.restore(sanitizedPackage);

    if (restoredCount === 0) throw new Error("Restored count was 0");

    const restoredStr = JSON.stringify(restoredPackage);
    if (!restoredStr.includes("john.doe@acme.com") || !restoredStr.includes("123-45-6789")) {
      throw new Error("Restore failed to return raw sensitive values");
    }

    results.push({ name: "PrivacyGuardrail: Reversible Restoration", passed: true });
  } catch (err: any) {
    results.push({ name: "PrivacyGuardrail: Reversible Restoration", passed: false, error: err.message });
  }

  // Test 4: Audit Trail
  try {
    const guardrail = new PrivacyGuardrail();
    const pkg = createSensitivePkg();
    guardrail.sanitize(pkg);
    const audit = guardrail.audit();

    if (audit.totalSanitized === 0 || audit.auditLogs.length === 0) {
      throw new Error("Audit log empty after sanitize");
    }
    results.push({ name: "PrivacyGuardrail: Audit Logging", passed: true });
  } catch (err: any) {
    results.push({ name: "PrivacyGuardrail: Audit Logging", passed: false, error: err.message });
  }

  return results;
}
