import { PublishedArtifact, PublicationManifest, SemanticPublication } from "../domain/models";

export type OutputFormat = "json" | "markdown" | "html" | "text";

export interface RendererMetadata {
  id: string;
  name: string;
  format: OutputFormat;
  version: string;
}

export interface RenderOptions {
  publisherName?: string;
  templateVersion?: string;
  schemaVersion?: string;
  audience?: string;
  publicationVersion?: string;
  provenanceHash?: string;
}

export interface IRenderer<TSemanticPublication extends SemanticPublication = SemanticPublication, TOutput = string> {
  readonly metadata: RendererMetadata;

  /**
   * Renders a semantic publication model into formatted output with standard PublishedArtifact envelope.
   */
  render(
    semanticModel: TSemanticPublication,
    options?: RenderOptions
  ): Promise<PublishedArtifact<TOutput>>;

  /**
   * Validates whether the semantic publication or rendered artifact conforms to format schema.
   */
  validate(artifact: PublishedArtifact<TOutput>): boolean;

  /**
   * Serializes the artifact into string representation.
   */
  serialize(artifact: PublishedArtifact<TOutput>): string;

  /**
   * Calculates content hash for rendered output.
   */
  calculateContentHash(output: TOutput): string;
}

export class RendererRegistry {
  private renderers: Map<OutputFormat, IRenderer<any, any>> = new Map();

  public register(renderer: IRenderer<any, any>): void {
    this.renderers.set(renderer.metadata.format, renderer);
  }

  public get(format: OutputFormat): IRenderer<any, any> | undefined {
    return this.renderers.get(format);
  }

  public list(): IRenderer<any, any>[] {
    return Array.from(this.renderers.values());
  }
}
