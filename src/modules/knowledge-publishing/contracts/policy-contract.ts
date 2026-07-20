import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";

export interface PublicationPolicy {
  id: string;
  name: string;
  minOverallConfidence?: number;
  allowedPrivacyClassifications?: string[];
  requireGovernanceValidation?: boolean;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  reasons: string[];
}

export interface IPublicationPolicyEngine {
  evaluate(packageData: ValidatedKnowledgePackage, policy?: PublicationPolicy): PolicyEvaluationResult;
}

export class DefaultPublicationPolicyEngine implements IPublicationPolicyEngine {
  public evaluate(packageData: ValidatedKnowledgePackage, policy?: PublicationPolicy): PolicyEvaluationResult {
    const defaultPolicy: PublicationPolicy = {
      id: "default-governance-policy",
      name: "Default Governance Policy",
      minOverallConfidence: 0.5,
      allowedPrivacyClassifications: ["Public", "Internal", "Confidential", "Restricted"],
      requireGovernanceValidation: true,
      ...policy,
    };

    const reasons: string[] = [];

    if (defaultPolicy.requireGovernanceValidation && packageData.governanceStatus !== "Validated") {
      reasons.push(`Package governance status is '${packageData.governanceStatus}', expected 'Validated'`);
    }

    if (defaultPolicy.minOverallConfidence !== undefined) {
      const confidence = packageData.overallConfidence?.overallConfidence ?? 1.0;
      if (confidence < defaultPolicy.minOverallConfidence) {
        reasons.push(`Composite confidence ${confidence} is below minimum threshold ${defaultPolicy.minOverallConfidence}`);
      }
    }

    if (defaultPolicy.allowedPrivacyClassifications && packageData.privacyClassification) {
      const privacyLevel = typeof packageData.privacyClassification === "string"
        ? packageData.privacyClassification
        : (packageData.privacyClassification as any)?.level || "Internal";

      if (!defaultPolicy.allowedPrivacyClassifications.includes(privacyLevel)) {
        reasons.push(`Privacy classification '${privacyLevel}' is not allowed by policy`);
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }
}
