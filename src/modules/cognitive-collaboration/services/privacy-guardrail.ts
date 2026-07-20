import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import { IPrivacyGuardrail } from "../contracts/collaboration-contract";
import { DataResidencyPolicy } from "../domain/models";

export class PrivacyGuardrail implements IPrivacyGuardrail {
  private vault: Map<string, { original: string; type: string; createdAt: number }> = new Map();
  private auditLogs: string[] = [];

  private patterns = [
    { type: "API_KEY", regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{16,})['"]?/gi },
    { type: "BEARER_TOKEN", regex: /Bearer\s+([a-zA-Z0-9\-._~+/]+=*)/gi },
    { type: "PASSWORD", regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi },
    { type: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: "EMAIL", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { type: "PHONE", regex: /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
    { type: "FINANCIAL_VALUE", regex: /\$\d+(?:\,\d{3})*(?:\.\d{2})?\b|\b\d+\s*(?:million|billion|USD|EUR|GBP)\b/gi },
    { type: "CUSTOMER_ID", regex: /\bCUST-[A-Z0-9]{4,10}\b/g },
  ];

  public sanitize<T>(
    evidencePackage: AgentEvidencePackage<T>,
    policy: DataResidencyPolicy = "Global"
  ): { sanitizedPackage: AgentEvidencePackage<T>; tokenMapCount: number } {
    let tokenMapCount = 0;

    const sanitizeString = (str: string): string => {
      let result = str;

      for (const pat of this.patterns) {
        pat.regex.lastIndex = 0;
        result = result.replace(pat.regex, (...args: any[]) => {
          const match: string = args[0];
          const fullStr: string = args[args.length - 1];
          const offset: number = args[args.length - 2];
          const group1: string | undefined = typeof args[1] === "string" && args.length > 3 ? args[1] : undefined;

          // If the match occurs inside an already generated [TOKEN_...], skip it!
          if (typeof fullStr === "string") {
            const prefix = fullStr.substring(0, offset);
            const lastOpenBracket = prefix.lastIndexOf("[TOKEN_");
            const lastCloseBracket = prefix.lastIndexOf("]");
            if (lastOpenBracket !== -1 && lastOpenBracket > lastCloseBracket) {
              return match; // inside existing token, skip
            }
          }

          const secretVal = group1 || match;
          const token = `[TOKEN_${pat.type}_${Math.random().toString(36).substring(2, 9).toUpperCase()}]`;

          this.vault.set(token, { original: secretVal, type: pat.type, createdAt: Date.now() });
          tokenMapCount++;

          this.auditLogs.push(
            `[Sanitize Audit] Type: ${pat.type} | Token: ${token} | Policy: ${policy} | Timestamp: ${new Date().toISOString()}`
          );

          if (group1 && match.includes(group1)) {
            return match.replace(group1, token);
          }
          return token;
        });
      }
      return result;
    };

    const traverseAndSanitize = (val: any): any => {
      if (typeof val === "string") {
        return sanitizeString(val);
      }
      if (Array.isArray(val)) {
        return val.map(traverseAndSanitize);
      }
      if (val !== null && typeof val === "object") {
        const copy: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          copy[k] = traverseAndSanitize(v);
        }
        return copy;
      }
      return val;
    };

    const sanitizedPackage: AgentEvidencePackage<T> = traverseAndSanitize(evidencePackage);

    if (sanitizedPackage.governance) {
      sanitizedPackage.governance.policyNotes = [
        ...(sanitizedPackage.governance.policyNotes || []),
        `PrivacyGuardrail applied: ${tokenMapCount} tokens generated under ${policy} policy.`,
      ];
    }

    return { sanitizedPackage, tokenMapCount };
  }

  public restore<T>(
    sanitizedPackage: AgentEvidencePackage<T>
  ): { restoredPackage: AgentEvidencePackage<T>; restoredCount: number } {
    let restoredCount = 0;

    const restoreString = (str: string): string => {
      let result = str;
      for (const [token, data] of this.vault.entries()) {
        if (result.includes(token)) {
          result = result.split(token).join(data.original);
          restoredCount++;
          this.auditLogs.push(
            `[Restore Audit] Restored Token: ${token} | Type: ${data.type} | Timestamp: ${new Date().toISOString()}`
          );
        }
      }
      return result;
    };

    const traverseAndRestore = (val: any): any => {
      if (typeof val === "string") {
        return restoreString(val);
      }
      if (Array.isArray(val)) {
        return val.map(traverseAndRestore);
      }
      if (val !== null && typeof val === "object") {
        const copy: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          copy[k] = traverseAndRestore(v);
        }
        return copy;
      }
      return val;
    };

    const restoredPackage: AgentEvidencePackage<T> = traverseAndRestore(sanitizedPackage);
    return { restoredPackage, restoredCount };
  }

  public classify(text: string): { sensitivity: string; detectedPatterns: string[] } {
    const detected: string[] = [];

    for (const pat of this.patterns) {
      pat.regex.lastIndex = 0;
      if (pat.regex.test(text)) {
        detected.push(pat.type);
      }
    }

    let sensitivity = "Public";
    if (detected.length > 0) {
      if (detected.includes("API_KEY") || detected.includes("BEARER_TOKEN") || detected.includes("PASSWORD")) {
        sensitivity = "Restricted";
      } else if (detected.includes("SSN") || detected.includes("FINANCIAL_VALUE")) {
        sensitivity = "Regulated";
      } else {
        sensitivity = "Confidential";
      }
    }

    return { sensitivity, detectedPatterns: detected };
  }

  public audit(): { totalSanitized: number; activeTokens: number; auditLogs: string[] } {
    return {
      totalSanitized: this.auditLogs.length,
      activeTokens: this.vault.size,
      auditLogs: [...this.auditLogs],
    };
  }
}
