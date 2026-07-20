import { IRenderer, RenderOptions, RendererMetadata } from "../contracts/renderer-contract";
import { HashingEngine } from "../domain/hashing";
import { PublishedArtifact, PublicationManifest, SemanticPublication } from "../domain/models";
import { HtmlTemplates } from "../templates/html-templates";

export class HtmlRenderer implements IRenderer<SemanticPublication, string> {
  public readonly metadata: RendererMetadata = {
    id: "html-renderer",
    name: "HTML Document Renderer",
    format: "html",
    version: "1.0.0",
  };

  public async render(
    semanticModel: SemanticPublication,
    options?: RenderOptions
  ): Promise<PublishedArtifact<string>> {
    const bodyHtml = HtmlTemplates.render(semanticModel);
    const semanticHash = HashingEngine.computeSemanticHash(semanticModel as unknown as Record<string, unknown>);
    const contentHash = HashingEngine.computeContentHash(bodyHtml);
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

    const renderedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="publication-id" content="${manifest.publicationId}">
  <meta name="semantic-hash" content="${manifest.semanticHash}">
  <meta name="content-hash" content="${manifest.contentHash}">
  <meta name="provenance-hash" content="${manifest.provenanceHash}">
  <title>${semanticModel.publicationType} - ${manifest.sourcePackageId}</title>
</head>
<body>
  ${bodyHtml}
</body>
</html>`.trim();

    return {
      renderedContent,
      semanticModel: semanticModel as unknown as Record<string, unknown>,
      manifest,
      schemaVersion: manifest.schemaVersion,
      renderedAt: manifest.generatedAt,
      metadata: { format: "html" },
    };
  }

  public validate(artifact: PublishedArtifact<string>): boolean {
    return typeof artifact.renderedContent === "string" && artifact.renderedContent.includes("<!DOCTYPE html>");
  }

  public serialize(artifact: PublishedArtifact<string>): string {
    return artifact.renderedContent;
  }

  public calculateContentHash(output: string): string {
    return HashingEngine.computeContentHash(output);
  }
}
