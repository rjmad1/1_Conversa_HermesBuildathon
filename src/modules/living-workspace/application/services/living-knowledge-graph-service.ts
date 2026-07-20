/**
 * Living Knowledge Graph Application Service
 */

import { PlatformEventBus } from "../../../../platform/events";
import { LIVING_WORKSPACE_EVENTS } from "../../domain/events";
import type {
  GraphNodeRef,
  RelationshipConfidence,
  SemanticCluster,
  GraphHealthMetrics,
  TemporalRelationship,
  AIDiscoveredRelationship,
  OrphanNode,
  DuplicateEntityCandidate,
  StaleKnowledgeItem,
  GraphEvolutionRecord,
} from "../../domain/types";

export class LivingKnowledgeGraphService {
  private nodes: Map<string, GraphNodeRef> = new Map();
  private edgeConfidences: Map<string, RelationshipConfidence> = new Map();
  private temporalEdges: Map<string, TemporalRelationship> = new Map();
  private aiDiscoveredRelationships: Map<string, AIDiscoveredRelationship> = new Map();
  private clusters: Map<string, SemanticCluster> = new Map();
  private evolutionHistory: GraphEvolutionRecord[] = [];

  constructor(private eventBus: PlatformEventBus) {}

  public registerNode(node: GraphNodeRef): void {
    this.nodes.set(node.id, node);
  }

  public registerRelationship(
    edgeId: string,
    sourceId: string,
    targetId: string,
    relationType: string,
    confidenceScore: number,
    reasoningSummary: string,
    provenanceSource: string,
    verifiedBy?: string
  ): RelationshipConfidence {
    const record: RelationshipConfidence = {
      edgeId,
      sourceId,
      targetId,
      relationType,
      confidenceScore: Math.min(1.0, Math.max(0.0, confidenceScore)),
      reasoningSummary,
      provenance: {
        source: provenanceSource,
        verifiedBy,
        timestamp: Date.now(),
      },
    };

    this.edgeConfidences.set(edgeId, record);

    const historyRecord: GraphEvolutionRecord = {
      recordId: `evol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      eventType: "relationship_added",
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      relationType,
      metadata: { confidenceScore, provenanceSource },
    };
    this.evolutionHistory.push(historyRecord);

    return record;
  }

  public proposeAIDiscoveredRelationship(
    sourceId: string,
    targetId: string,
    suggestedRelationType: string,
    confidenceScore: number,
    rationale: string,
    evidence: string[],
    provenanceSource: string
  ): AIDiscoveredRelationship {
    const id = `ai_rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const proposal: AIDiscoveredRelationship = {
      id,
      sourceId,
      targetId,
      suggestedRelationType,
      confidenceScore: Math.min(1.0, Math.max(0.0, confidenceScore)),
      rationale,
      evidence,
      provenanceSource,
      status: "proposed",
      createdAt: Date.now(),
    };

    this.aiDiscoveredRelationships.set(id, proposal);
    return proposal;
  }

  public approveAIDiscoveredRelationship(proposalId: string, approvedBy: string): RelationshipConfidence | null {
    const proposal = this.aiDiscoveredRelationships.get(proposalId);
    if (!proposal) return null;

    proposal.status = "approved";
    const edgeId = `edge_${proposal.sourceId}_${proposal.targetId}_${Date.now()}`;
    const rel = this.registerRelationship(
      edgeId,
      proposal.sourceId,
      proposal.targetId,
      proposal.suggestedRelationType,
      proposal.confidenceScore,
      proposal.rationale,
      proposal.provenanceSource,
      approvedBy
    );

    this.eventBus.publish(LIVING_WORKSPACE_EVENTS.GRAPH_EVOLVED, {
      workspaceId: "default",
      addedEdgesCount: 1,
      clusterCount: this.clusters.size,
      healthScore: this.getGraphHealthMetrics().graphHealthScore,
      timestamp: Date.now(),
    });

    return rel;
  }

  public detectOrphanNodes(): OrphanNode[] {
    const connectedNodeIds = new Set<string>();
    for (const rel of this.edgeConfidences.values()) {
      connectedNodeIds.add(rel.sourceId);
      connectedNodeIds.add(rel.targetId);
    }

    const orphans: OrphanNode[] = [];
    for (const node of this.nodes.values()) {
      if (!connectedNodeIds.has(node.id)) {
        orphans.push({
          nodeId: node.id,
          nodeType: node.type,
          title: node.title,
          isolatedSince: node.lastUpdatedAt,
          suggestedConnections: [],
        });
      }
    }
    return orphans;
  }

  public detectDuplicateEntities(): DuplicateEntityCandidate[] {
    const candidates: DuplicateEntityCandidate[] = [];
    const nodeList = Array.from(this.nodes.values());

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i];
        const b = nodeList[j];
        if (a && b && a.type === b.type && a.id !== b.id) {
          const titleA = a.title.toLowerCase().trim();
          const titleB = b.title.toLowerCase().trim();
          if (titleA === titleB || (titleA.length > 3 && titleB.includes(titleA))) {
            candidates.push({
              entityIdA: a.id,
              entityIdB: b.id,
              entityType: a.type,
              similarityScore: titleA === titleB ? 1.0 : 0.85,
              matchingAttributes: ["title", "type"],
            });
          }
        }
      }
    }
    return candidates;
  }

  public detectStaleKnowledge(maxInactiveDays: number = 30): StaleKnowledgeItem[] {
    const now = Date.now();
    const staleMs = maxInactiveDays * 24 * 60 * 60 * 1000;
    const staleItems: StaleKnowledgeItem[] = [];

    for (const node of this.nodes.values()) {
      const inactiveMs = now - node.lastUpdatedAt;
      if (inactiveMs > staleMs) {
        const daysInactive = Math.floor(inactiveMs / (24 * 60 * 60 * 1000));
        const decayScore = Math.min(1.0, daysInactive / 90);
        staleItems.push({
          entityId: node.id,
          entityType: node.type,
          title: node.title,
          lastModifiedAt: node.lastUpdatedAt,
          daysInactive,
          decayScore,
        });
      }
    }
    return staleItems;
  }

  public computeSemanticClusters(): SemanticCluster[] {
    const topicGroups = new Map<string, string[]>();

    for (const node of this.nodes.values()) {
      const topic = node.type || "General";
      if (!topicGroups.has(topic)) {
        topicGroups.set(topic, []);
      }
      topicGroups.get(topic)!.push(node.id);
    }

    const clusters: SemanticCluster[] = [];
    let idx = 1;
    for (const [topic, nodeIds] of topicGroups.entries()) {
      const cluster: SemanticCluster = {
        clusterId: `cluster_${idx++}`,
        name: `${topic} Knowledge Cluster`,
        topic,
        nodeIds,
        centroidKeywords: [topic.toLowerCase()],
        densityScore: nodeIds.length > 1 ? Math.min(1.0, nodeIds.length / 10) : 0.5,
      };
      clusters.push(cluster);
      this.clusters.set(cluster.clusterId, cluster);
    }
    return clusters;
  }

  public getGraphHealthMetrics(): GraphHealthMetrics {
    const totalNodes = this.nodes.size;
    const totalEdges = this.edgeConfidences.size;
    const orphans = this.detectOrphanNodes();
    const duplicates = this.detectDuplicateEntities();
    const stale = this.detectStaleKnowledge();

    let score = 100;
    score -= orphans.length * 5;
    score -= duplicates.length * 8;
    score -= stale.length * 3;
    const graphHealthScore = Math.max(0, Math.min(100, score));

    return {
      totalNodes,
      totalEdges,
      orphanCount: orphans.length,
      duplicateCount: duplicates.length,
      staleCount: stale.length,
      brokenCount: 0,
      graphHealthScore,
    };
  }

  public getEvolutionHistory(): GraphEvolutionRecord[] {
    return [...this.evolutionHistory];
  }

  public getAIDiscoveredRelationships(): AIDiscoveredRelationship[] {
    return Array.from(this.aiDiscoveredRelationships.values());
  }

  public getEdgeConfidence(edgeId: string): RelationshipConfidence | undefined {
    return this.edgeConfidences.get(edgeId);
  }
}
