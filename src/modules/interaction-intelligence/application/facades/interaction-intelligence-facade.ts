/**
 * Interaction Intelligence Facade
 * Unified entry point orchestrating all 10 Interaction Intelligence Engines.
 */
import { PlatformEventBus } from "../../../../platform/events";
import { WorkspaceSessionMemoryEngine } from "../engines/workspace-session-memory-engine";
import { SpatialNavigationHistoryEngine } from "../engines/spatial-navigation-history-engine";
import { ContextStackEngine } from "../engines/context-stack-engine";
import { EntityPreviewEngine } from "../engines/entity-preview-engine";
import { UniversalActivityEngine } from "../engines/universal-activity-engine";
import { AIConfidenceEngine } from "../engines/ai-confidence-engine";
import { ProgressiveComplexityEngine } from "../engines/progressive-complexity-engine";
import { PersonaEngine } from "../engines/persona-engine";
import { WorkspaceDNAEngine } from "../engines/workspace-dna-engine";
import { ExplainabilityEngine } from "../engines/explainability-engine";

import {
  InMemorySessionMemoryStore,
  InMemorySpatialHistoryStore,
  InMemoryContextStackStore,
  InMemoryEntityPreviewStore,
  InMemoryActivityStreamStore,
  InMemoryWorkspaceDNAStore,
  InMemoryPersonaConfigStore,
  InMemoryCapabilityGateStore,
} from "../../infrastructure/adapters/in-memory-adapters";

import type {
  ISessionMemoryStore,
  ISpatialHistoryStore,
  IContextStackStore,
  IEntityPreviewStore,
  IActivityStreamStore,
  IWorkspaceDNAStore,
  IPersonaConfigStore,
  ICapabilityGateStore,
  IAegisOSProviderAdapter,
} from "../../domain/ports/provider-ports";

export interface IntelligenceStores {
  sessionStore?: ISessionMemoryStore;
  spatialStore?: ISpatialHistoryStore;
  contextStore?: IContextStackStore;
  previewStore?: IEntityPreviewStore;
  activityStore?: IActivityStreamStore;
  dnaStore?: IWorkspaceDNAStore;
  personaStore?: IPersonaConfigStore;
  gateStore?: ICapabilityGateStore;
}

export class InteractionIntelligenceFacade {
  public eventBus: PlatformEventBus;

  // 10 Engines
  public sessionMemory: WorkspaceSessionMemoryEngine;
  public spatialHistory: SpatialNavigationHistoryEngine;
  public contextStack: ContextStackEngine;
  public entityPreview: EntityPreviewEngine;
  public universalActivity: UniversalActivityEngine;
  public aiConfidence: AIConfidenceEngine;
  public progressiveComplexity: ProgressiveComplexityEngine;
  public persona: PersonaEngine;
  public workspaceDNA: WorkspaceDNAEngine;
  public explainability: ExplainabilityEngine;

  private activeAegisAdapter?: IAegisOSProviderAdapter;

  constructor(eventBus?: PlatformEventBus, customStores?: IntelligenceStores) {
    this.eventBus = eventBus || new PlatformEventBus();

    const sessionStore = customStores?.sessionStore || new InMemorySessionMemoryStore();
    const spatialStore = customStores?.spatialStore || new InMemorySpatialHistoryStore();
    const contextStore = customStores?.contextStore || new InMemoryContextStackStore();
    const previewStore = customStores?.previewStore || new InMemoryEntityPreviewStore();
    const activityStore = customStores?.activityStore || new InMemoryActivityStreamStore();
    const dnaStore = customStores?.dnaStore || new InMemoryWorkspaceDNAStore();
    const personaStore = customStores?.personaStore || new InMemoryPersonaConfigStore();
    const gateStore = customStores?.gateStore || new InMemoryCapabilityGateStore();

    this.sessionMemory = new WorkspaceSessionMemoryEngine(sessionStore, this.eventBus);
    this.spatialHistory = new SpatialNavigationHistoryEngine(spatialStore, this.eventBus);
    this.contextStack = new ContextStackEngine(contextStore, this.eventBus);
    this.entityPreview = new EntityPreviewEngine(previewStore, this.eventBus);
    this.universalActivity = new UniversalActivityEngine(activityStore, this.eventBus);
    this.aiConfidence = new AIConfidenceEngine(this.eventBus);
    this.progressiveComplexity = new ProgressiveComplexityEngine(gateStore, this.eventBus);
    this.persona = new PersonaEngine(personaStore, this.eventBus);
    this.workspaceDNA = new WorkspaceDNAEngine(dnaStore, this.eventBus);
    this.explainability = new ExplainabilityEngine(this.eventBus);
  }

  public async initialize(tenantId: string, workspaceId: string, userId: string): Promise<void> {
    await this.sessionMemory.initializeSession(tenantId, workspaceId, userId);
    await this.progressiveComplexity.initialize(userId);
    await this.workspaceDNA.getOrInitializeDNA(workspaceId);

    // Initial activity log
    await this.universalActivity.logActivity(
      "Sync",
      "Normal",
      "Workspace Interaction Intelligence Initialized",
      `Session and engines active for workspace ${workspaceId}`,
      "System"
    );
  }

  /**
   * Future AegisOS Adapter Injection.
   * Swaps providers cleanly without modifying engines or UI components.
   */
  public registerAegisOSAdapter(adapter: IAegisOSProviderAdapter): void {
    this.activeAegisAdapter = adapter;
    console.log(`[InteractionIntelligenceFacade] AegisOS Adapter registered: ${adapter.providerName}`);
  }

  public isAegisOSActive(): boolean {
    return !!this.activeAegisAdapter;
  }
}
