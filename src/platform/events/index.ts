export interface PlatformEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  timestamp: number;
  correlationId?: string;
  tenantId?: string;
  workspaceId?: string;
  payload: TPayload;
}

export type EventCallback<TPayload = Record<string, unknown>> = (event: PlatformEvent<TPayload>) => void | Promise<void>;

export class PlatformEventBus {
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();

  public subscribe<TPayload = Record<string, unknown>>(
    eventType: string,
    callback: EventCallback<TPayload>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const set = this.listeners.get(eventType)!;
    set.add(callback as EventCallback<any>);

    return () => {
      set.delete(callback as EventCallback<any>);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  public async publish<TPayload = Record<string, unknown>>(
    eventType: string,
    payload: TPayload,
    metadata?: { correlationId?: string; tenantId?: string; workspaceId?: string }
  ): Promise<void> {
    const event: PlatformEvent<TPayload> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: eventType,
      timestamp: Date.now(),
      correlationId: metadata?.correlationId,
      tenantId: metadata?.tenantId,
      workspaceId: metadata?.workspaceId,
      payload,
    };

    const targetListeners = this.listeners.get(eventType);
    if (!targetListeners || targetListeners.size === 0) return;

    const promises = Array.from(targetListeners).map((cb) => {
      try {
        return Promise.resolve(cb(event));
      } catch (err) {
        console.error(`[PlatformEventBus] Error handling event ${eventType}:`, err);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  public clear(): void {
    this.listeners.clear();
  }
}
