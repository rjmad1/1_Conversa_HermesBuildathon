import { PlatformEventBus } from "../../../platform/events";
import { COGNITIVE_COLLABORATION_EVENTS, KnowledgePackagePublishedPayload } from "../../cognitive-collaboration/events/events";
import { ValidatedKnowledgePackage } from "../../cognitive-collaboration/domain/models";

import { AdapterRegistry } from "../contracts/adapter-contract";
import { DefaultPublicationPolicyEngine, IPublicationPolicyEngine, PublicationPolicy } from "../contracts/policy-contract";
import { PRESET_PUBLICATION_PROFILES, PublicationProfile } from "../contracts/profile-contract";
import { PublisherRegistry } from "../contracts/publisher-contract";
import { OutputFormat, RendererRegistry } from "../contracts/renderer-contract";
import { HashingEngine } from "../domain/hashing";
import { PublishedArtifact, SemanticPublication } from "../domain/models";
import { KNOWLEDGE_PUBLISHING_EVENTS } from "../events/events";

import { ActionRegisterPublisher } from "../publishers/action-register-publisher";
import { DecisionRegisterPublisher } from "../publishers/decision-register-publisher";
import { EngineeringPublisher } from "../publishers/engineering-publisher";
import { ExecutivePublisher } from "../publishers/executive-publisher";
import { MachinePublisher } from "../publishers/machine-publisher";
import { RiskRegisterPublisher } from "../publishers/risk-register-publisher";
import { StakeholderBriefPublisher } from "../publishers/stakeholder-brief-publisher";

import { HtmlRenderer } from "../serializers/html-renderer";
import { JsonRenderer } from "../serializers/json-renderer";
import { MarkdownRenderer } from "../serializers/markdown-renderer";
import { PlainTextRenderer } from "../serializers/plain-text-renderer";

export class SemanticPublicationBus {
  public readonly publishers: PublisherRegistry = new PublisherRegistry();
  public readonly renderers: RendererRegistry = new RendererRegistry();
  public readonly adapters: AdapterRegistry = new AdapterRegistry();
  public readonly policyEngine: IPublicationPolicyEngine;

  private unsubscribeEventBus?: () => void;

  constructor(
    public readonly eventBus: PlatformEventBus,
    customPolicyEngine?: IPublicationPolicyEngine
  ) {
    this.policyEngine = customPolicyEngine || new DefaultPublicationPolicyEngine();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // Register Default Publishers
    this.publishers.register(new ExecutivePublisher());
    this.publishers.register(new EngineeringPublisher());
    this.publishers.register(new ActionRegisterPublisher());
    this.publishers.register(new DecisionRegisterPublisher());
    this.publishers.register(new RiskRegisterPublisher());
    this.publishers.register(new StakeholderBriefPublisher());
    this.publishers.register(new MachinePublisher());

    // Register Default Renderers
    this.renderers.register(new JsonRenderer());
    this.renderers.register(new MarkdownRenderer());
    this.renderers.register(new HtmlRenderer());
    this.renderers.register(new PlainTextRenderer());
  }

  /**
   * Initializes event subscription to listen to Cognitive Collaboration Engine events.
   */
  public startListening(): void {
    if (this.unsubscribeEventBus) return;

    this.unsubscribeEventBus = this.eventBus.subscribe<KnowledgePackagePublishedPayload>(
      COGNITIVE_COLLABORATION_EVENTS.KNOWLEDGE_PACKAGE_PUBLISHED,
      async (event) => {
        const packageData = event.payload.knowledgePackage;
        if (packageData) {
          await this.publishPackage(packageData, PRESET_PUBLICATION_PROFILES.FULL);
        }
      }
    );
  }

  public stopListening(): void {
    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus();
      this.unsubscribeEventBus = undefined;
    }
  }

  /**
   * Orchestrates semantic publication and rendering for a ValidatedKnowledgePackage.
   */
  public async publishPackage(
    packageData: ValidatedKnowledgePackage,
    profileOrName?: PublicationProfile | string,
    policy?: PublicationPolicy
  ): Promise<PublishedArtifact<any>[]> {
    const policyResult = this.policyEngine.evaluate(packageData, policy);
    if (!policyResult.allowed) {
      const errorMsg = `Policy evaluation rejected publication for package ${packageData.packageId}: ${policyResult.reasons.join("; ")}`;
      await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_FAILED, {
        sourcePackageId: packageData.packageId,
        publisherId: "all",
        error: errorMsg,
        timestamp: Date.now(),
      });
      throw new Error(errorMsg);
    }

    const profile: PublicationProfile = (typeof profileOrName === "string"
      ? PRESET_PUBLICATION_PROFILES[profileOrName.toUpperCase()]
      : profileOrName) ?? PRESET_PUBLICATION_PROFILES.FULL!;

    const producedArtifacts: PublishedArtifact<any>[] = [];
    const provenanceHash = HashingEngine.computeProvenanceHash(packageData, "Conversa.SemanticPublicationEngine");

    for (const publisherId of profile.publisherIds) {
      const publisher = this.publishers.get(publisherId);
      if (!publisher) continue;

      await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_REQUESTED, {
        sourcePackageId: packageData.packageId,
        publisherId,
        profileId: profile.id,
        targetFormats: profile.targetFormats,
        timestamp: Date.now(),
      });

      try {
        const semanticModel: SemanticPublication = await publisher.publish(packageData);

        for (const format of profile.targetFormats) {
          const renderer = this.renderers.get(format as OutputFormat);
          if (!renderer) continue;

          const artifact = await renderer.render(semanticModel, {
            publisherName: publisher.metadata.name,
            audience: publisher.metadata.targetAudience,
            provenanceHash,
          });

          producedArtifacts.push(artifact);

          await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_GENERATED, {
            publicationId: artifact.manifest.publicationId,
            sourcePackageId: packageData.packageId,
            publisherId: publisher.metadata.id,
            rendererId: renderer.metadata.id,
            semanticModel,
            artifact,
            manifest: artifact.manifest,
            timestamp: Date.now(),
          });

          const isValid = renderer.validate(artifact);
          await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_VALIDATED, {
            publicationId: artifact.manifest.publicationId,
            manifest: artifact.manifest,
            isValid,
            timestamp: Date.now(),
          });

          // Trigger registered outbound adapters
          for (const adapter of this.adapters.list()) {
            if (adapter.metadata.enabled) {
              const exportRes = await adapter.export(artifact);
              if (exportRes.success) {
                await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_EXPORTED, {
                  publicationId: artifact.manifest.publicationId,
                  adapterId: adapter.metadata.id,
                  exportId: exportRes.exportId,
                  targetSystem: adapter.metadata.targetSystem,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }
      } catch (err: any) {
        await this.eventBus.publish(KNOWLEDGE_PUBLISHING_EVENTS.PUBLICATION_FAILED, {
          sourcePackageId: packageData.packageId,
          publisherId,
          error: err.message || String(err),
          timestamp: Date.now(),
        });
      }
    }

    return producedArtifacts;
  }
}
