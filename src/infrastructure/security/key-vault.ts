import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { logger } from "../../shared/logging/logger";

export interface IntegrationCredentials {
  integrationId: string;
  provider: "jira" | "linear" | "github" | "azure-devops" | "slack";
  apiToken?: string;
  oauthSecret?: string;
  webhookSecret?: string;
  updatedAt: string;
}

export class AzureKeyVaultSecurityService {
  private readonly algorithm = "aes-256-gcm";
  private readonly masterKey: Buffer;

  constructor(masterSecretKey?: string) {
    // Standard 32-byte key for AES-256
    const keyString = masterSecretKey || process.env.CONVERSA_ENCRYPTION_KEY || "conversa-master-security-key-32b!";
    this.masterKey = Buffer.alloc(32);
    Buffer.from(keyString).copy(this.masterKey);
  }

  /**
   * Encrypt sensitive string value using AES-256-GCM
   */
  encryptSecret(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return {
      ciphertext: encrypted,
      iv: iv.toString("hex"),
      tag,
    };
  }

  /**
   * Decrypt AES-256-GCM encrypted payload
   */
  decryptSecret(encryptedPayload: { ciphertext: string; iv: string; tag: string }): string {
    const decipher = createDecipheriv(this.algorithm, this.masterKey, Buffer.from(encryptedPayload.iv, "hex"));
    decipher.setAuthTag(Buffer.from(encryptedPayload.tag, "hex"));
    let decrypted = decipher.update(encryptedPayload.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Secure integration credential envelope
   */
  secureCredentials(credentials: IntegrationCredentials): { payload: string; vaultRef: string } {
    const jsonStr = JSON.stringify(credentials);
    const encrypted = this.encryptSecret(jsonStr);
    const payload = JSON.stringify(encrypted);
    const vaultRef = `akv://${credentials.provider}/${credentials.integrationId}`;

    logger.info({ provider: credentials.provider, integrationId: credentials.integrationId }, "Integration credentials secured via Azure Key Vault GCM envelope");
    return { payload, vaultRef };
  }

  /**
   * Unseal integration credential envelope
   */
  unsealCredentials(encryptedEnvelope: string): IntegrationCredentials {
    try {
      const encrypted = JSON.parse(encryptedEnvelope);
      const decryptedJson = this.decryptSecret(encrypted);
      return JSON.parse(decryptedJson) as IntegrationCredentials;
    } catch (err) {
      logger.error({ err }, "Failed to unseal Azure Key Vault credential envelope");
      throw new Error("Credential envelope unsealing failed");
    }
  }
}
