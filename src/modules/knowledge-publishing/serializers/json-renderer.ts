import { IRenderer, RenderOptions, RendererMetadata } from "../contracts/renderer-contract";
import { CanonicalSerializer } from "../domain/canonical-serializer";
import { HashingEngine } from "../domain/hashing";
import { PublishedArtifact, PublicationManifest, SemanticPublication } from "../domain/models";

export class JsonRenderer implements IRenderer<SemanticPublication, string> {
  public readonly metadata: RendererMetadata = {
    id: "json-renderer",
    name: "JSON Serialization Renderer",
    format: "json",
    version: "1.0.0",
  };

  public async render(
    semanticModel: SemanticPublication,
    options?: RenderOptions
  ): Promise<PublishedArtifact<string>> {
    const renderedContent = CanonicalSerializer.serialize(semanticModel);
    const semanticHash = HashingEngine.computeSemanticHash(semanticModel as unknown as Record<string, unknown>);
    const contentHash = HashingEngine.computeContentHash(renderedContent);
    const provenanceHash = options?.provenanceHash || HashingEngine.sha256(`provenance_${semanticModel.sourceId}`);

    const manifest: PublicationManifest = {
      publicationId: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourcePackageId: semanticModel.sourceId,
      publisher: options?.publisherName || "UnknownPublisher",
      renderer: this.metadata.name,
      audience: options?.audience || "General",
      templateVersion: options?.templateVersion || "1.0.0",
      schemaVersion: options?.schemaVersion || "1.0.0",
      publicationVersion: options?.publicationVersion || "1.0.0",
      generatedAt: Date.now(),
      semanticHash,
      contentHash,
      provenanceHash,
    };

    return {
      renderedContent,
      semanticModel: semanticModel as unknown as Record<string, unknown>,
      manifest,
      schemaVersion: manifest.schemaVersion,
      renderedAt: manifest.generatedAt,
      metadata: { format: "json" },
    };
  }

  public validate(artifact: PublishedArtifact<string>): boolean {
    try {
      JSON.parse(artifact.renderedContent);
      return artifact.manifest?.contentHash === HashingEngine.computeContentHash(artifact.renderedContent);
    } catch {
      return false;
    }
  }

  public serialize(artifact: PublishedArtifact<string>): string {
    return JSON.stringify(artifact, null, 2);
  }

  public calculateContentHash(output: string): string {
    return HashingEngine.computeContentHash(output);
  }
}
