import { PlatformEventBus } from "../../../platform/events";
import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";
import { PublicationPolicy } from "../contracts/policy-contract";
import { PRESET_PUBLICATION_PROFILES, PublicationProfile } from "../contracts/profile-contract";
import { OutputFormat } from "../contracts/renderer-contract";
import { PublishedArtifact, SemanticPublication } from "../domain/models";
import { SemanticPublicationBus } from "./semantic-publication-bus";

export class KnowledgePublishingService {
  public readonly bus: SemanticPublicationBus;

  constructor(eventBus?: PlatformEventBus) {
    const busInstance = new PlatformEventBus();
    this.bus = new SemanticPublicationBus(eventBus || busInstance);
    this.bus.startListening();
  }

  /**
   * Publishes a ValidatedKnowledgePackage using a specified profile or defaults to FULL.
   */
  public async publish(
    packageData: ValidatedKnowledgePackage,
    profile?: PublicationProfile | string,
    policy?: PublicationPolicy
  ): Promise<PublishedArtifact<any>[]> {
    return this.bus.publishPackage(packageData, profile, policy);
  }

  /**
   * Generates a single target publication model without running full renderers.
   */
  public async generateSemanticModel<T extends SemanticPublication>(
    packageData: ValidatedKnowledgePackage,
    publisherId: string
  ): Promise<T> {
    const publisher = this.bus.publishers.get(publisherId);
    if (!publisher) {
      throw new Error(`Publisher '${publisherId}' not found in KnowledgePublishingService`);
    }
    return publisher.publish(packageData) as Promise<T>;
  }

  /**
   * Renders a semantic model into a single specified format.
   */
  public async renderFormat<T = string>(
    semanticModel: SemanticPublication,
    format: OutputFormat
  ): Promise<PublishedArtifact<T>> {
    const renderer = this.bus.renderers.get(format);
    if (!renderer) {
      throw new Error(`Renderer for format '${format}' not registered in KnowledgePublishingService`);
    }
    return renderer.render(semanticModel);
  }
}
