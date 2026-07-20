import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { SemanticPublication } from "../domain/models";

export interface PublisherMetadata {
  id: string;
  name: string;
  version: string;
  publicationType: string;
  targetAudience: string;
}

export interface IKnowledgePublisher<TSemanticPublication extends SemanticPublication = SemanticPublication> {
  readonly metadata: PublisherMetadata;

  /**
   * Transforms a canonical ValidatedKnowledgePackage into a strongly-typed Semantic Publication.
   * Publishers are 100% deterministic and MUST NOT invoke LLMs or perform asynchronous network calls.
   */
  publish(packageData: ValidatedKnowledgePackage, options?: Record<string, unknown>): Promise<TSemanticPublication>;
}

export class PublisherRegistry {
  private publishers: Map<string, IKnowledgePublisher<any>> = new Map();

  public register(publisher: IKnowledgePublisher<any>): void {
    this.publishers.set(publisher.metadata.id, publisher);
    this.publishers.set(publisher.metadata.publicationType, publisher);
  }

  public get(idOrType: string): IKnowledgePublisher<any> | undefined {
    return this.publishers.get(idOrType);
  }

  public list(): IKnowledgePublisher<any>[] {
    const unique = new Set(this.publishers.values());
    return Array.from(unique);
  }
}
