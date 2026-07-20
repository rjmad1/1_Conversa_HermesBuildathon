import { createHash } from "crypto";
import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { CanonicalSerializer } from "./canonical-serializer";

export class HashingEngine {
  /**
   * Calculates SHA-256 hex digest of a string or object.
   */
  public static sha256(data: string | Buffer): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Calculates the Semantic Hash representing the domain meaning of a publication.
   * Strips ephemeral/generation timestamps so identical knowledge yields identical SemanticHash.
   */
  public static computeSemanticHash(semanticModel: Record<string, unknown>): string {
    const canonicalString = CanonicalSerializer.serialize(semanticModel, { excludeVolatileFields: true });
    return this.sha256(canonicalString);
  }

  /**
   * Calculates the Content Hash representing the rendered output byte/text stream.
   */
  public static computeContentHash(renderedContent: string | Buffer | Record<string, unknown>): string {
    const data = typeof renderedContent === "string"
      ? renderedContent
      : Buffer.isBuffer(renderedContent)
      ? renderedContent
      : CanonicalSerializer.serialize(renderedContent);
    return this.sha256(data);
  }

  /**
   * Calculates the Provenance Hash for a ValidatedKnowledgePackage and publisher lineage.
   */
  public static computeProvenanceHash(
    sourcePackage: ValidatedKnowledgePackage,
    publisherName: string,
    publisherVersion: string = "1.0.0"
  ): string {
    const lineagePayload = {
      packageId: sourcePackage.packageId,
      sourceId: sourcePackage.sourceId,
      sourceType: sourcePackage.sourceType,
      evidencePackageIds: (sourcePackage.evidencePackageIds || []).slice().sort(),
      provenanceSummary: sourcePackage.provenanceSummary || [],
      privacyClassification: sourcePackage.privacyClassification,
      governanceStatus: sourcePackage.governanceStatus,
      publisherName,
      publisherVersion,
    };

    const canonicalLineage = CanonicalSerializer.serialize(lineagePayload);
    return this.sha256(canonicalLineage);
  }
}
