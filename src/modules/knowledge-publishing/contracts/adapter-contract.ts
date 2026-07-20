import { PublishedArtifact } from "../domain/models";

export interface AdapterMetadata {
  id: string;
  name: string;
  targetSystem: string; // e.g. "AegisOS", "REST_API", "FileSystem", "Slack", "Teams"
  enabled: boolean;
}

export interface IOutboundAdapter {
  readonly metadata: AdapterMetadata;

  /**
   * Transports a published artifact to an external destination.
   * Adapters NEVER transform domain knowledge or modify canonical publications.
   */
  export(artifact: PublishedArtifact<any>): Promise<{ success: boolean; exportId: string; timestamp: number }>;
}

export class AdapterRegistry {
  private adapters: Map<string, IOutboundAdapter> = new Map();

  public register(adapter: IOutboundAdapter): void {
    this.adapters.set(adapter.metadata.id, adapter);
  }

  public get(id: string): IOutboundAdapter | undefined {
    return this.adapters.get(id);
  }

  public list(): IOutboundAdapter[] {
    return Array.from(this.adapters.values());
  }
}
