/**
 * Engine 3: Context Stack Engine
 * Manages contextual layer stacking (Meeting -> Decision -> Task -> AI Insight -> Automation -> Approval).
 */
import { PlatformEventBus } from "../../../../platform/events";
import type { ContextFrame, ContextStack, ContextLayerType } from "../../domain/domain-models";
import { INTERACTION_INTELLIGENCE_EVENTS } from "../../domain/events/domain-events";
import type { IContextStackStore } from "../../domain/ports/provider-ports";

export class ContextStackEngine {
  private currentStack: ContextStack;

  constructor(
    private contextStore: IContextStackStore,
    private eventBus: PlatformEventBus
  ) {
    this.currentStack = {
      stackId: `ctx_stack_${Date.now()}`,
      frames: [],
      activeFrameId: "",
      depth: 0,
      updatedAt: Date.now(),
    };
  }

  public async pushFrame(
    layerType: ContextLayerType,
    entityId: string,
    title: string,
    metadata: Record<string, unknown> = {}
  ): Promise<ContextFrame> {
    const newFrame: ContextFrame = {
      frameId: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      layerType,
      entityId,
      title,
      metadata,
      createdAt: Date.now(),
      status: "active",
    };

    // Suspend current active frame if present
    if (this.currentStack.activeFrameId) {
      const active = this.currentStack.frames.find((f) => f.frameId === this.currentStack.activeFrameId);
      if (active) active.status = "suspended";
    }

    this.currentStack.frames.push(newFrame);
    this.currentStack.activeFrameId = newFrame.frameId;
    this.currentStack.depth = this.currentStack.frames.length;
    this.currentStack.updatedAt = Date.now();

    await this.contextStore.saveStack(this.currentStack);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.CONTEXT_FRAME_PUSHED, {
      frame: newFrame,
      stackDepth: this.currentStack.depth,
    });

    return newFrame;
  }

  public async popFrame(): Promise<ContextFrame | null> {
    if (this.currentStack.frames.length === 0) return null;

    const popped = this.currentStack.frames.pop()!;
    popped.status = "completed";

    const last = this.currentStack.frames[this.currentStack.frames.length - 1];
    if (last) {
      last.status = "active";
      this.currentStack.activeFrameId = last.frameId;
    } else {
      this.currentStack.activeFrameId = "";
    }

    this.currentStack.depth = this.currentStack.frames.length;
    this.currentStack.updatedAt = Date.now();

    await this.contextStore.saveStack(this.currentStack);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.CONTEXT_FRAME_POPPED, {
      frame: popped,
      stackDepth: this.currentStack.depth,
    });

    return popped;
  }

  public getStack(): ContextStack {
    return this.currentStack;
  }

  public peekFrame(): ContextFrame | null {
    return this.currentStack.frames[this.currentStack.frames.length - 1] || null;
  }

  public async resetStack(): Promise<void> {
    this.currentStack.frames = [];
    this.currentStack.activeFrameId = "";
    this.currentStack.depth = 0;
    this.currentStack.updatedAt = Date.now();

    await this.contextStore.saveStack(this.currentStack);
    await this.eventBus.publish(INTERACTION_INTELLIGENCE_EVENTS.CONTEXT_STACK_RESET, {});
  }
}
