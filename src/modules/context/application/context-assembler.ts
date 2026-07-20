import { CanonicalContext } from "../domain/entities/canonical-context";
import { ContextProfileRegistry } from "../domain/profiles/context-profile";
import {
  BreadcrumbProvider,
  ParentChainProvider,
  NeighborhoodProvider,
  RelationshipSummaryProvider,
} from "./providers/context-providers";

export class ContextAssembler {
  private profileRegistry = new ContextProfileRegistry();
  private breadcrumbsProvider = new BreadcrumbProvider();
  private parentChainProvider = new ParentChainProvider();
  private neighborhoodProvider = new NeighborhoodProvider();
  private summaryProvider = new RelationshipSummaryProvider();

  public assembleContext(
    rootItem: any,
    rawEdges: any[] = [],
    rawItems: any[] = [],
    profileName?: string
  ): CanonicalContext {
    const profile = this.profileRegistry.getProfile(profileName);
    const rootId = rootItem.id || rootItem._id;

    // Index items by ID for fast lookup
    const itemsById = new Map<string, any>();
    itemsById.set(rootId, rootItem);
    for (const item of rawItems) {
      itemsById.set(item.id || item._id, item);
    }

    const breadcrumbs = profile.includeBreadcrumbs
      ? this.breadcrumbsProvider.resolveBreadcrumbs(rootItem, itemsById)
      : [];

    const parentChain = profile.includeParentChain
      ? this.parentChainProvider.resolveParentChain(rootItem, rawEdges, itemsById)
      : [];

    const graphNeighborhood = profile.includeNeighborhood
      ? this.neighborhoodProvider.resolveNeighborhood(rootItem, rawEdges, itemsById, profile)
      : [];

    const relationshipSummary = profile.includeRelationshipSummary
      ? this.summaryProvider.resolveSummary(rootItem, rawEdges)
      : {};

    const children = rawEdges
      .filter((e) => e.sourceId === rootId)
      .map((e) => {
        const item = itemsById.get(e.targetId);
        return {
          id: e.targetId,
          title: item ? item.title || item.name : "Untitled",
          relationType: e.relationType || "child_of",
        };
      });

    return {
      rootId,
      breadcrumbs,
      parentChain,
      children,
      graphNeighborhood,
      relationshipSummary,
      workspaceContext: {
        tenantId: rootItem.tenantId || "default",
        workspaceId: rootItem.workspaceId || "default",
        scope: rootItem.visibility || "workspace",
      },
      expansionDepth: profile.maxDepth,
      version: 1,
    };
  }
}
