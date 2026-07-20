/**
 * Engine 4: Entity Preview Engine
 * Progressive assembly for Hover, Peek, Expand, Pin, and Open entity previews with L1/L2 caching.
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { EntityPreviewData, PreviewMode } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { IEntityPreviewStore } from "../../domain/ports/provider-ports";

export class EntityPreviewEngine {
  private l1Cache: Map<string, { preview: EntityPreviewData; expiresAt: number }> = new Map();
  private pinnedPreviews: Map<string, EntityPreviewData> = new Map();
  private ttlMs: number = 30000; // 30 second L1 memory TTL

  constructor(
    private previewStore: IEntityPreviewStore,
    private eventBus: PlatformEventBus
  ) {}

  public async getPreview(entityId: string, mode: PreviewMode = "Hover"): Promise<EntityPreviewData> {
    const cacheKey = `${entityId}:${mode}`;
    const cached = this.l1Cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.preview;
    }

    // Attempt L2 cache / provider lookup
    const stored = await this.previewStore.getPreview(entityId, mode);
    if (stored) {
      this.l1Cache.set(cacheKey, { preview: stored, expiresAt: Date.now() + this.ttlMs });
      return stored;
    }

    // Default progressive mock preview for instant UI response
    const freshPreview: EntityPreviewData = {
      entityId,
      entityType: "KnowledgeEntity",
      title: `Entity (${entityId})`,
      aiSummary: `AI generated context summary for entity ${entityId}.`,
      metadata: { createdAt: Date.now(), tags: ["workspace", "entity"] },
      relationships: [
        { targetId: "rel_1", targetType: "Meeting", relationshipType: "DISCUSSED_IN", title: "Quarterly Planning" },
      ],
      recentActivity: [`Updated entity metadata`, `Linked to task`],
      ownership: { ownerId: "usr_default", ownerName: "Workspace Member" },
      nextActions: ["Review decision", "Assign owner"],
      linkedEntityIds: ["rel_1"],
      confidenceScore: 92,
      status: "Active",
      mode,
      isPinned: this.pinnedPreviews.has(entityId),
      fetchedAt: Date.now(),
    };

    this.l1Cache.set(cacheKey, { preview: freshPreview, expiresAt: Date.now() + this.ttlMs });
    await this.previewStore.savePreview(freshPreview);

    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.PREVIEW_REQUESTED, {
      preview: freshPreview,
    });

    return freshPreview;
  }

  public pinPreview(preview: EntityPreviewData): void {
    preview.isPinned = true;
    this.pinnedPreviews.set(preview.entityId, preview);
    this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.PREVIEW_PINNED, { preview });
  }

  public unpinPreview(entityId: string): void {
    const preview = this.pinnedPreviews.get(entityId);
    if (preview) {
      preview.isPinned = false;
      this.pinnedPreviews.delete(entityId);
      this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.PREVIEW_UNPINNED, { preview });
    }
  }

  public getPinnedPreviews(): EntityPreviewData[] {
    return Array.from(this.pinnedPreviews.values());
  }
}
