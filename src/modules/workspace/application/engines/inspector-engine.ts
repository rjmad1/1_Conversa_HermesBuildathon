import type { WorkspaceRegistry } from "../registry/workspace-registry";
import type { SelectionBus } from "./selection-bus";
import type { WorkspaceSelection } from "../../domain/value-objects/workspace-selection";
import type { InspectorSectionDescriptor } from "../registry/provider-contracts";

export class InspectorEngine {
  constructor(
    private registry: WorkspaceRegistry,
    private selectionBus: SelectionBus
  ) {}

  public async getInspectorContentForCurrentSelection(): Promise<{
    selection: WorkspaceSelection;
    sections: {
      id: string;
      title: string;
      order: number;
      data: { label: string; value: string; type?: string; linkUri?: string }[];
    }[];
  }> {
    const selection = this.selectionBus.getSelection();
    if (!selection.focusedObjectId) {
      return { selection, sections: [] };
    }

    const providers = this.registry.getInspectorSectionProviders();
    const allDescriptors: InspectorSectionDescriptor[] = [];

    for (const provider of providers) {
      if (provider.isEnabled({ selection })) {
        try {
          const sections = await provider.getInspectorSections(selection);
          allDescriptors.push(...sections);
        } catch (err) {
          console.error(`[InspectorEngine] Error fetching sections from provider ${provider.id}:`, err);
        }
      }
    }

    allDescriptors.sort((a, b) => a.order - b.order);

    const renderedSections = await Promise.all(
      allDescriptors.map(async (desc) => {
        try {
          const res = await desc.renderAsync(selection);
          return {
            id: desc.id,
            title: res.title,
            order: desc.order,
            data: res.items,
          };
        } catch (err) {
          return {
            id: desc.id,
            title: desc.title,
            order: desc.order,
            data: [{ label: "Error", value: "Failed to render section" }],
          };
        }
      })
    );

    return { selection, sections: renderedSections };
  }
}
