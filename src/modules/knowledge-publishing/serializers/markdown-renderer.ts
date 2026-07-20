import { IRenderer, RenderOptions, RendererMetadata } from "../contracts/renderer-contract";
import { HashingEngine } from "../domain/hashing";
import { PublishedArtifact, PublicationManifest, SemanticPublication } from "../domain/models";
import { MarkdownTemplates } from "../templates/markdown-templates";

export class MarkdownRenderer implements IRenderer<SemanticPublication, string> {
  public readonly metadata: RendererMetadata = {
    id: "markdown-renderer",
    name: "Markdown Document Renderer",
    format: "markdown",
    version: "1.0.0",
  };

  public async render(
    semanticModel: SemanticPublication,
    options?: RenderOptions
  ): Promise<PublishedArtifact<string>> {
    const bodyText = MarkdownTemplates.render(semanticModel);
    const semanticHash = HashingEngine.computeSemanticHash(semanticModel as unknown as Record<string, unknown>);
    const contentHash = HashingEngine.computeContentHash(bodyText);
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

    const renderedContent = [
      `---`,
      `publicationId: "${manifest.publicationId}"`,
      `sourcePackageId: "${manifest.sourcePackageId}"`,
      `publisher: "${manifest.publisher}"`,
      `semanticHash: "${manifest.semanticHash}"`,
      `contentHash: "${manifest.contentHash}"`,
      `provenanceHash: "${manifest.provenanceHash}"`,
      `---`,
      ``,
      bodyText,
    ].join("\n");

    return {
      renderedContent,
      semanticModel: semanticModel as unknown as Record<string, unknown>,
      manifest,
      schemaVersion: manifest.schemaVersion,
      renderedAt: manifest.generatedAt,
      metadata: { format: "markdown" },
    };
  }

  public validate(artifact: PublishedArtifact<string>): boolean {
    return typeof artifact.renderedContent === "string" && artifact.renderedContent.length > 0;
  }

  public serialize(artifact: PublishedArtifact<string>): string {
    return artifact.renderedContent;
  }

  public calculateContentHash(output: string): string {
    return HashingEngine.computeContentHash(output);
  }
}
