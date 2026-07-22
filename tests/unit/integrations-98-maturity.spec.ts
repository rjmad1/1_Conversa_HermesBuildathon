import { describe, it, expect } from "vitest";
import { CredentialEncryptionService } from "../../src/shared/security/credential-encryption";
import { HandOffDispatcher, type HandOffActionItem } from "../../src/modules/integrations/hand-off-dispatcher";

describe("Product Maturity 98% Capability Suite", () => {
  describe("AES-256-GCM Envelope Credential Encryption", () => {
    it("successfully encrypts and decrypts sensitive integration API keys", () => {
      const plainApiKey = "lin_api_key_live_99887766554433221100";
      const encryptedPayload = CredentialEncryptionService.encrypt(plainApiKey);

      expect(encryptedPayload.ciphertext).toBeDefined();
      expect(encryptedPayload.iv).toBeDefined();
      expect(encryptedPayload.tag).toBeDefined();
      expect(encryptedPayload.ciphertext).not.toEqual(plainApiKey);

      const decrypted = CredentialEncryptionService.decrypt(encryptedPayload);
      expect(decrypted).toEqual(plainApiKey);
    });

    it("fails decryption when secret or auth tag is corrupted", () => {
      const plainApiKey = "jira_pat_sec_token_abcdef123456";
      const encryptedPayload = CredentialEncryptionService.encrypt(plainApiKey);

      const corruptedPayload = {
        ...encryptedPayload,
        tag: "00000000000000000000000000000000",
      };

      expect(() => {
        CredentialEncryptionService.decrypt(corruptedPayload);
      }).toThrow("Failed to decrypt credential payload");
    });
  });

  describe("Autonomous Confidence-Based Auto-Dispatch", () => {
    const dispatcher = new HandOffDispatcher();

    it("approves auto-dispatch when confidence score >= 0.95", () => {
      const highConfidenceAction: HandOffActionItem = {
        id: "act-95",
        title: "Deploy Redis cluster for caching",
        description: "Set up 3-node Redis sentinel cluster",
        confidenceScore: 0.96,
      };

      expect(dispatcher.shouldAutoDispatch(highConfidenceAction, 0.95)).toBe(true);
    });

    it("rejects auto-dispatch and mandates HITL review when confidence score < 0.95", () => {
      const mediumConfidenceAction: HandOffActionItem = {
        id: "act-80",
        title: "Update API rate limits",
        description: "Lower tier 1 API rate limits",
        confidenceScore: 0.82,
      };

      expect(dispatcher.shouldAutoDispatch(mediumConfidenceAction, 0.95)).toBe(false);
    });

    it("handles missing confidence scores by defaulting to manual review", () => {
      const unratedAction: HandOffActionItem = {
        id: "act-00",
        title: "Investigate memory leak",
        description: "Memory profile heap snapshot",
      };

      expect(dispatcher.shouldAutoDispatch(unratedAction)).toBe(false);
    });
  });

  describe("SRE Dead Letter Queue (DLQ) & Exponential Retries", () => {
    it("routes persistent dispatch failures to Dead Letter Queue (DLQ)", async () => {
      const dispatcher = new HandOffDispatcher({});
      const action: HandOffActionItem = {
        id: "act-fail-dlq",
        title: "Sync feature flags to Jira",
        description: "Failing dispatch payload",
      };

      const result = await dispatcher.dispatchWithDLQRetry("unsupported-target" as any, action, {}, 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain("pushed to DLQ");

      const dlq = dispatcher.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);
      const firstItem = dlq[0];
      expect(firstItem).toBeDefined();
      if (firstItem) {
        expect(firstItem.actionId).toBe("act-fail-dlq");
        expect(firstItem.destination).toBe("unsupported-target");
      }
    });
  });
});
