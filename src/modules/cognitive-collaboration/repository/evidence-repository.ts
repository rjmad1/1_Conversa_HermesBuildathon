import { AgentEvidencePackage } from "../../meeting-intelligence/contracts/agent-contract";
import { EvidenceFilter, IEvidenceRepository } from "../contracts/collaboration-contract";
import { EvidenceComparisonReport, EvidenceLineageTree } from "../domain/models";

export class EvidenceRepository implements IEvidenceRepository {
  private packages: Map<string, AgentEvidencePackage<any>> = new Map();
  private metadataMap: Map<string, Record<string, any>> = new Map();

  // Multi-index projections
  private indexBySource: Map<string, Set<string>> = new Map();
  private indexByWorkspace: Map<string, Set<string>> = new Map();
  private indexByAgent: Map<string, Set<string>> = new Map();
  private indexBySpeaker: Map<string, Set<string>> = new Map();
  private indexByTopic: Map<string, Set<string>> = new Map();
  private indexByCorrelation: Map<string, Set<string>> = new Map();

  public async append(
    evidencePackage: AgentEvidencePackage<any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.packages.has(evidencePackage.packageId)) {
      throw new Error(
        `[EvidenceRepository] Immutable collision: Package '${evidencePackage.packageId}' already exists. Evidence cannot be mutated or overwritten.`
      );
    }

    // Freeze or store immutable copy
    const frozenPackage = JSON.parse(JSON.stringify(evidencePackage));
    const packageId = frozenPackage.packageId;

    this.packages.set(packageId, frozenPackage);
    this.metadataMap.set(packageId, metadata || {});

    // Index projections
    const sourceId = frozenPackage.meetingId || metadata?.sourceId || "global";
    this.addToIndex(this.indexBySource, sourceId, packageId);

    if (metadata?.workspaceId) {
      this.addToIndex(this.indexByWorkspace, metadata.workspaceId, packageId);
    }
    if (frozenPackage.agentId) {
      this.addToIndex(this.indexByAgent, frozenPackage.agentId, packageId);
    }
    if (metadata?.correlationId) {
      this.addToIndex(this.indexByCorrelation, metadata.correlationId, packageId);
    }

    // Index evidence sources
    if (Array.isArray(frozenPackage.evidence)) {
      for (const ev of frozenPackage.evidence) {
        if (ev.speakerId) {
          this.addToIndex(this.indexBySpeaker, ev.speakerId, packageId);
        }
        if (ev.speakerName) {
          this.addToIndex(this.indexBySpeaker, ev.speakerName, packageId);
        }
      }
    }

    if (metadata?.topics && Array.isArray(metadata.topics)) {
      for (const topic of metadata.topics) {
        this.addToIndex(this.indexByTopic, topic, packageId);
      }
    }
  }

  public async retrieve(packageId: string): Promise<AgentEvidencePackage<any> | null> {
    const pkg = this.packages.get(packageId);
    if (!pkg) return null;
    return JSON.parse(JSON.stringify(pkg));
  }

  public async filter(criteria: EvidenceFilter): Promise<AgentEvidencePackage<any>[]> {
    let candidateIds: Set<string> | null = null;

    const sourceId = criteria.meetingId || criteria.sourceId;
    if (sourceId && this.indexBySource.has(sourceId)) {
      candidateIds = new Set(this.indexBySource.get(sourceId)!);
    }

    if (criteria.workspaceId && this.indexByWorkspace.has(criteria.workspaceId)) {
      candidateIds = this.intersectSets(candidateIds, this.indexByWorkspace.get(criteria.workspaceId)!);
    }

    if (criteria.agentId && this.indexByAgent.has(criteria.agentId)) {
      candidateIds = this.intersectSets(candidateIds, this.indexByAgent.get(criteria.agentId)!);
    }

    if (criteria.speakerId && this.indexBySpeaker.has(criteria.speakerId)) {
      candidateIds = this.intersectSets(candidateIds, this.indexBySpeaker.get(criteria.speakerId)!);
    }

    if (criteria.topic && this.indexByTopic.has(criteria.topic)) {
      candidateIds = this.intersectSets(candidateIds, this.indexByTopic.get(criteria.topic)!);
    }

    if (criteria.correlationId && this.indexByCorrelation.has(criteria.correlationId)) {
      candidateIds = this.intersectSets(candidateIds, this.indexByCorrelation.get(criteria.correlationId)!);
    }

    const allPkgs = candidateIds
      ? Array.from(candidateIds).map((id) => this.packages.get(id)!).filter(Boolean)
      : Array.from(this.packages.values());

    return allPkgs.filter((pkg) => {
      const meta = this.metadataMap.get(pkg.packageId) || {};

      if (criteria.capability && meta.capability !== criteria.capability && pkg.agentId !== criteria.capability) {
        return false;
      }
      if (criteria.minConfidence !== undefined && pkg.overallConfidence < criteria.minConfidence) {
        return false;
      }
      if (criteria.startTimeMs !== undefined && pkg.createdAt < criteria.startTimeMs) {
        return false;
      }
      if (criteria.endTimeMs !== undefined && pkg.createdAt > criteria.endTimeMs) {
        return false;
      }
      if (criteria.transcriptSegmentId) {
        const hasSegment = pkg.evidence?.some((e) => e.transcriptLocation?.segmentId === criteria.transcriptSegmentId);
        if (!hasSegment) return false;
      }
      return true;
    });
  }

  public async replay(sourceId: string, criteria?: EvidenceFilter): Promise<AgentEvidencePackage<any>[]> {
    const packages = await this.filter({ ...criteria, sourceId });
    return packages.sort((a, b) => a.createdAt - b.createdAt);
  }

  public async compare(packageIdA: string, packageIdB: string): Promise<EvidenceComparisonReport> {
    const pkgA = await this.retrieve(packageIdA);
    const pkgB = await this.retrieve(packageIdB);

    if (!pkgA || !pkgB) {
      throw new Error(`[EvidenceRepository] Compare error: One or both packages not found ('${packageIdA}', '${packageIdB}')`);
    }

    const diffs: EvidenceComparisonReport["fieldDiffs"] = [];

    // Structural diff over top-level properties
    const keys = new Set([...Object.keys(pkgA.payload || {}), ...Object.keys(pkgB.payload || {})]);
    let totalFields = 0;
    let matchingFields = 0;

    for (const key of keys) {
      totalFields++;
      const valA = (pkgA.payload as any)?.[key];
      const valB = (pkgB.payload as any)?.[key];
      const conflict = JSON.stringify(valA) !== JSON.stringify(valB);

      if (!conflict) matchingFields++;

      diffs.push({
        field: `payload.${key}`,
        valueA: valA,
        valueB: valB,
        conflict,
      });
    }

    const overlapScore = totalFields > 0 ? matchingFields / totalFields : 1.0;

    return {
      packageIdA,
      packageIdB,
      overlapScore,
      fieldDiffs: diffs,
      comparedAt: Date.now(),
    };
  }

  public async getLineage(packageId: string): Promise<EvidenceLineageTree> {
    const pkg = await this.retrieve(packageId);
    if (!pkg) {
      throw new Error(`[EvidenceRepository] Lineage error: Package '${packageId}' not found.`);
    }

    const meta = this.metadataMap.get(packageId) || {};
    const parentId = meta.parentPackageId;
    const ancestors: string[] = [];

    let currentParent = parentId;
    while (currentParent && this.packages.has(currentParent)) {
      ancestors.push(currentParent);
      const parentMeta = this.metadataMap.get(currentParent) || {};
      currentParent = parentMeta.parentPackageId;
    }

    const descendants: string[] = [];
    const corrections: string[] = [];

    for (const [id, m] of this.metadataMap.entries()) {
      if (m.parentPackageId === packageId) {
        descendants.push(id);
        if (m.isCorrection) {
          corrections.push(id);
        }
      }
    }

    return {
      rootPackageId: packageId,
      ancestors,
      descendants,
      corrections,
    };
  }

  private addToIndex(indexMap: Map<string, Set<string>>, key: string, id: string): void {
    if (!indexMap.has(key)) {
      indexMap.set(key, new Set());
    }
    indexMap.get(key)!.add(id);
  }

  private intersectSets(a: Set<string> | null, b: Set<string>): Set<string> {
    if (!a) return new Set(b);
    const result = new Set<string>();
    for (const item of a) {
      if (b.has(item)) {
        result.add(item);
      }
    }
    return result;
  }
}
