/**
 * Workspace Evolution Engine Application Service
 */

import { PlatformEventBus } from "../../../../platform/events";
import { LIVING_WORKSPACE_EVENTS } from "../../domain/events";
import type {
  WorkspaceDNAMetrics,
  WorkspaceEvolutionProposal,
  EvolutionProposalCategory,
} from "../../domain/types";

export class WorkspaceEvolutionService {
  private proposals: Map<string, WorkspaceEvolutionProposal> = new Map();

  constructor(private eventBus: PlatformEventBus) {}

  public analyzeDNAAndPropose(
    workspaceId: string,
    dnaMetrics: WorkspaceDNAMetrics
  ): WorkspaceEvolutionProposal[] {
    const generatedProposals: WorkspaceEvolutionProposal[] = [];

    // 1. Recurring workflow pattern -> Recommend Automation Rule
    for (const pattern of dnaMetrics.recurringWorkflows) {
      if (pattern.frequency >= 3) {
        const prop = this.createProposal({
          workspaceId,
          category: "AutomationRule",
          title: `Automate Workflow: ${pattern.name}`,
          rationale: `Workflow "${pattern.name}" has occurred ${pattern.frequency} times. Converting to an automated rule will reduce manual effort.`,
          evidence: [`Observed ${pattern.frequency} times`, `Last seen at ${new Date(pattern.lastObserved).toISOString()}`],
          confidenceScore: 0.88,
          isReversible: true,
          payload: { patternName: pattern.name, frequency: pattern.frequency },
        });
        generatedProposals.push(prop);
      }
    }

    // 2. Frequently used layouts -> Recommend Workspace View / Saved View
    for (const layout of dnaMetrics.layoutUsage) {
      if (layout.frequency >= 5) {
        const prop = this.createProposal({
          workspaceId,
          category: "WorkspaceView",
          title: `Promote Popular Layout to Saved View: ${layout.name}`,
          rationale: `Layout "${layout.name}" is used frequently (${layout.frequency} sessions). Save as a dedicated workspace view for 1-click access.`,
          evidence: [`Used ${layout.frequency} times across active sessions`],
          confidenceScore: 0.92,
          isReversible: true,
          payload: { layoutName: layout.name, frequency: layout.frequency },
        });
        generatedProposals.push(prop);
      }
    }

    // 3. Common meeting structures -> Recommend Reusable Template
    for (const mtg of dnaMetrics.meetingStructures) {
      if (mtg.frequency >= 2) {
        const prop = this.createProposal({
          workspaceId,
          category: "ReusableTemplate",
          title: `Create Reusable Meeting Template: ${mtg.name}`,
          rationale: `Meeting structure "${mtg.name}" recurs regularly. Standardize into a reusable meeting template.`,
          evidence: [`${mtg.frequency} matching meeting structures recorded`],
          confidenceScore: 0.85,
          isReversible: true,
          payload: { meetingStructureName: mtg.name },
        });
        generatedProposals.push(prop);
      }
    }

    // 4. Graph evolution rate -> Recommend Graph Taxonomy Improvement
    if (dnaMetrics.graphEvolutionRate > 10) {
      const prop = this.createProposal({
        workspaceId,
        category: "GraphTaxonomy",
        title: "Evolve Graph Taxonomy: Add Sub-Relationship Categories",
        rationale: `Graph growth rate (${dnaMetrics.graphEvolutionRate} new edges/week) indicates expanding domain complexity. Refining relationship taxonomy improves search precision.`,
        evidence: [`Growth rate: ${dnaMetrics.graphEvolutionRate} edges/week`],
        confidenceScore: 0.80,
        isReversible: true,
        payload: { graphEvolutionRate: dnaMetrics.graphEvolutionRate },
      });
      generatedProposals.push(prop);
    }

    return generatedProposals;
  }

  public createProposal(input: {
    workspaceId: string;
    category: EvolutionProposalCategory;
    title: string;
    rationale: string;
    evidence: string[];
    confidenceScore: number;
    isReversible?: boolean;
    payload?: Record<string, unknown>;
  }): WorkspaceEvolutionProposal {
    const id = `evo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const proposal: WorkspaceEvolutionProposal = {
      id,
      workspaceId: input.workspaceId,
      category: input.category,
      title: input.title,
      rationale: input.rationale,
      evidence: input.evidence,
      confidenceScore: Math.min(1.0, Math.max(0.0, input.confidenceScore)),
      isReversible: input.isReversible !== undefined ? input.isReversible : true,
      status: "proposed",
      payload: input.payload || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.proposals.set(id, proposal);

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.EVOLUTION_PROPOSED, {
      proposalId: id,
      workspaceId: input.workspaceId,
      category: input.category,
      title: input.title,
      confidenceScore: proposal.confidenceScore,
    });

    return proposal;
  }

  public acceptProposal(proposalId: string): WorkspaceEvolutionProposal | null {
    const prop = this.proposals.get(proposalId);
    if (!prop) return null;

    prop.status = "accepted";
    prop.updatedAt = Date.now();
    return prop;
  }

  public applyProposal(proposalId: string): WorkspaceEvolutionProposal | null {
    const prop = this.proposals.get(proposalId);
    if (!prop) return null;

    if (prop.status !== "accepted") {
      throw new Error(`Proposal ${proposalId} must be accepted before being applied.`);
    }

    prop.status = "applied";
    prop.updatedAt = Date.now();
    return prop;
  }

  public rejectProposal(proposalId: string): WorkspaceEvolutionProposal | null {
    const prop = this.proposals.get(proposalId);
    if (!prop) return null;

    prop.status = "rejected";
    prop.updatedAt = Date.now();
    return prop;
  }

  public getProposals(workspaceId: string): WorkspaceEvolutionProposal[] {
    return Array.from(this.proposals.values()).filter((p) => p.workspaceId === workspaceId);
  }
}
