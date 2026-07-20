/**
 * Engine 8: Adaptive Workspace Persona Engine
 * Manages persona profiles (Executive, Product, Engineering, Sales, CustomerSuccess, Operations, Research).
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { PersonaConfig, PersonaType } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { IPersonaConfigStore } from "../../domain/ports/provider-ports";

export class PersonaEngine {
  private currentPersona: PersonaType = "Product";

  constructor(
    private personaStore: IPersonaConfigStore,
    private eventBus: PlatformEventBus
  ) {}

  public getActivePersona(): PersonaType {
    return this.currentPersona;
  }

  public async setPersona(personaType: PersonaType): Promise<PersonaConfig> {
    this.currentPersona = personaType;
    let config = await this.personaStore.getPersonaConfig(personaType);

    if (!config) {
      config = this.getDefaultConfig(personaType);
      await this.personaStore.savePersonaConfig(config);
    }

    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.PERSONA_SWITCHED, {
      newPersona: personaType,
    });

    return config;
  }

  private getDefaultConfig(persona: PersonaType): PersonaConfig {
    const defaults: Record<PersonaType, PersonaConfig> = {
      Executive: {
        personaType: "Executive",
        navigationDefaults: ["workspace://executive-dashboard", "workspace://initiatives", "workspace://approvals"],
        layoutDefaults: "layout_executive_summary",
        defaultDashboards: ["dash_kpis", "dash_strategic_decisions"],
        shortcutPresets: ["cmd_open_exec_summary", "cmd_review_approvals"],
        aiSuggestionModes: ["strategic_summary", "risk_alert"],
      },
      Product: {
        personaType: "Product",
        navigationDefaults: ["workspace://roadmap", "workspace://features", "workspace://customer-feedback"],
        layoutDefaults: "layout_product_kanban",
        defaultDashboards: ["dash_roadmap_progress", "dash_feature_health"],
        shortcutPresets: ["cmd_create_spec", "cmd_link_user_story"],
        aiSuggestionModes: ["feature_gap_analysis", "user_sentiment"],
      },
      Engineering: {
        personaType: "Engineering",
        navigationDefaults: ["workspace://architecture-graph", "workspace://repos", "workspace://active-tasks"],
        layoutDefaults: "layout_engineering_split",
        defaultDashboards: ["dash_system_health", "dash_pr_queue"],
        shortcutPresets: ["cmd_open_code_graph", "cmd_trigger_ci"],
        aiSuggestionModes: ["code_review", "refactor_opportunities"],
      },
      Sales: {
        personaType: "Sales",
        navigationDefaults: ["workspace://deals", "workspace://accounts", "workspace://meeting-transcripts"],
        layoutDefaults: "layout_sales_pipeline",
        defaultDashboards: ["dash_pipeline", "dash_deal_stage"],
        shortcutPresets: ["cmd_log_call", "cmd_generate_proposal"],
        aiSuggestionModes: ["deal_intelligence", "competitor_battlecard"],
      },
      CustomerSuccess: {
        personaType: "CustomerSuccess",
        navigationDefaults: ["workspace://accounts", "workspace://tickets", "workspace://onboarding"],
        layoutDefaults: "layout_cs_overview",
        defaultDashboards: ["dash_nps", "dash_churn_risk"],
        shortcutPresets: ["cmd_log_customer_note", "cmd_create_ticket"],
        aiSuggestionModes: ["health_score_alert", "action_item_extractor"],
      },
      Operations: {
        personaType: "Operations",
        navigationDefaults: ["workspace://workflows", "workspace://integrations", "workspace://resource-allocation"],
        layoutDefaults: "layout_ops_control",
        defaultDashboards: ["dash_workflow_latency", "dash_integration_status"],
        shortcutPresets: ["cmd_trigger_sync", "cmd_view_audit_logs"],
        aiSuggestionModes: ["bottleneck_detector", "cost_optimizer"],
      },
      Research: {
        personaType: "Research",
        navigationDefaults: ["workspace://knowledge-graph", "workspace://documents", "workspace://notes"],
        layoutDefaults: "layout_research_canvas",
        defaultDashboards: ["dash_knowledge_coverage", "dash_recent_insights"],
        shortcutPresets: ["cmd_extract_insights", "cmd_link_nodes"],
        aiSuggestionModes: ["semantic_clustering", "citation_finder"],
      },
    };

    return defaults[persona];
  }
}
