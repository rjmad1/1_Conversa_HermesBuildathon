import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { logger } from "../logging/logger";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY_SALT = "conversa-enterprise-master-salt-2026";
const MASTER_SECRET = process.env.CONVERSA_KEY_VAULT_SECRET || "conversa-default-master-key-32-bytes-long!";

/**
 * Enterprise Credential Encryption Service
 * Encrypts integration API keys and OAuth credentials at rest using AES-256-GCM envelope encryption.
 */
export class CredentialEncryptionService {
  private static deriveKey(secret: string): Buffer {
    return scryptSync(secret, DEFAULT_KEY_SALT, 32);
  }

  /**
   * Encrypt a plaintext credential string
   */
  static encrypt(plaintext: string, secretOverride?: string): { ciphertext: string; iv: string; tag: string } {
    try {
      const key = this.deriveKey(secretOverride || MASTER_SECRET);
      const iv = randomBytes(16);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");
      const tag = cipher.getAuthTag().toString("hex");

      return {
        ciphertext: encrypted,
        iv: iv.toString("hex"),
        tag,
      };
    } catch (err) {
      logger.error({ err }, "Credential encryption failed");
      throw new Error("Failed to encrypt credential payload");
    }
  }

  /**
   * Decrypt an encrypted credential back to plaintext
   */
  static decrypt(encryptedPayload: { ciphertext: string; iv: string; tag: string }, secretOverride?: string): string {
    try {
      const key = this.deriveKey(secretOverride || MASTER_SECRET);
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encryptedPayload.iv, "hex"));
      decipher.setAuthTag(Buffer.from(encryptedPayload.tag, "hex"));

      let decrypted = decipher.update(encryptedPayload.ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (err) {
      logger.error({ err }, "Credential decryption failed");
      throw new Error("Failed to decrypt credential payload");
    }
  }
}
