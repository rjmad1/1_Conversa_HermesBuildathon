/**
 * Engine 7: Progressive Complexity Engine
 * Manages capability levels (Starter -> Professional -> Power User -> Administrator -> Enterprise) and feature gates.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { CapabilityLevel, CapabilityFeatureGate } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { ICapabilityGateStore } from "../../domain/ports/provider-ports";

export class ProgressiveComplexityEngine {
  private gate: CapabilityFeatureGate;

  constructor(
    private gateStore: ICapabilityGateStore,
    private eventBus: PlatformEventBus
  ) {
    this.gate = {
      level: "Starter",
      enabledFeatures: ["basic_nav", "simple_search", "inbox"],
      userOverrides: {},
    };
  }

  public async initialize(userId: string): Promise<CapabilityLevel> {
    const level = await this.gateStore.getCapabilityLevel(userId);
    this.gate.level = level;
    this.updateEnabledFeatures(level);
    return level;
  }

  public getLevel(): CapabilityLevel {
    return this.gate.level;
  }

  public async setLevel(userId: string, newLevel: CapabilityLevel): Promise<void> {
    const previousLevel = this.gate.level;
    this.gate.level = newLevel;
    this.updateEnabledFeatures(newLevel);

    await this.gateStore.setCapabilityLevel(userId, newLevel);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.COMPLEXITY_LEVEL_CHANGED, {
      newLevel,
      previousLevel,
    });
  }

  public isFeatureEnabled(featureId: string): boolean {
    if (this.gate.userOverrides[featureId] !== undefined) {
      return this.gate.userOverrides[featureId];
    }
    return this.gate.enabledFeatures.includes(featureId);
  }

  private updateEnabledFeatures(level: CapabilityLevel): void {
    const featuresMap: Record<CapabilityLevel, string[]> = {
      Starter: ["basic_nav", "simple_search", "inbox", "entity_preview_hover"],
      Professional: ["basic_nav", "simple_search", "inbox", "entity_preview_hover", "context_stack", "spatial_history", "inspector_customization"],
      PowerUser: ["basic_nav", "simple_search", "inbox", "entity_preview_hover", "context_stack", "spatial_history", "inspector_customization", "dna_recommendations", "advanced_graph_camera", "command_shortcuts"],
      Administrator: ["basic_nav", "simple_search", "inbox", "entity_preview_hover", "context_stack", "spatial_history", "inspector_customization", "dna_recommendations", "advanced_graph_camera", "command_shortcuts", "persona_management", "audit_streams", "governance_policy_editor"],
      Enterprise: ["basic_nav", "simple_search", "inbox", "entity_preview_hover", "context_stack", "spatial_history", "inspector_customization", "dna_recommendations", "advanced_graph_camera", "command_shortcuts", "persona_management", "audit_streams", "governance_policy_editor", "aegis_kernel_sync", "multi_tenant_isolation"],
    };

    this.gate.enabledFeatures = featuresMap[level] || featuresMap.Starter;
  }
}
