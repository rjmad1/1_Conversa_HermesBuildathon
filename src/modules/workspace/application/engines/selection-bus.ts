import { PlatformEventBus } from "../../../../platform/events";
import { WORKSPACE_EVENT_TYPES } from "../../domain/events/workspace-events";
import type { WorkspaceSelection } from "../../domain/value-objects/workspace-selection";

export class SelectionBus {
  private currentSelection: WorkspaceSelection = {
    selectedObjectIds: [],
    timestamp: Date.now(),
  };

  constructor(private eventBus: PlatformEventBus) {}

  public getSelection(): WorkspaceSelection {
    return { ...this.currentSelection };
  }

  public setSelection(selection: Partial<WorkspaceSelection>): void {
    const previousSelection = { ...this.currentSelection };
    this.currentSelection = {
      focusedObjectId: selection.focusedObjectId ?? this.currentSelection.focusedObjectId,
      focusedObjectType: selection.focusedObjectType ?? this.currentSelection.focusedObjectType,
      selectedObjectIds: selection.selectedObjectIds ?? this.currentSelection.selectedObjectIds,
      activeViewId: selection.activeViewId ?? this.currentSelection.activeViewId,
      contextMetadata: selection.contextMetadata ?? this.currentSelection.contextMetadata,
      timestamp: Date.now(),
    };

    this.eventBus.publish(WORKSPACE_EVENT_TYPES.SELECTION_CHANGED, {
      selection: this.currentSelection,
      previousSelection,
    });
  }

  public subscribe(callback: (selection: WorkspaceSelection) => void): () => void {
    return this.eventBus.subscribe(WORKSPACE_EVENT_TYPES.SELECTION_CHANGED, (evt) => {
      callback(evt.payload.selection as WorkspaceSelection);
    });
  }
}
