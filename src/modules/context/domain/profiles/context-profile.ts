export interface ContextProfileConfig {
  name: string;
  maxDepth: number;
  includeBreadcrumbs: boolean;
  includeParentChain: boolean;
  includeNeighborhood: boolean;
  includeRelationshipSummary: boolean;
  allowedRelationTypes?: string[];
}

export class ContextProfileRegistry {
  private profiles = new Map<string, ContextProfileConfig>();

  constructor() {
    this.profiles.set("Minimal", {
      name: "Minimal",
      maxDepth: 1,
      includeBreadcrumbs: true,
      includeParentChain: false,
      includeNeighborhood: false,
      includeRelationshipSummary: false,
    });

    this.profiles.set("Navigation", {
      name: "Navigation",
      maxDepth: 2,
      includeBreadcrumbs: true,
      includeParentChain: true,
      includeNeighborhood: false,
      includeRelationshipSummary: true,
    });

    this.profiles.set("Workspace", {
      name: "Workspace",
      maxDepth: 2,
      includeBreadcrumbs: true,
      includeParentChain: true,
      includeNeighborhood: true,
      includeRelationshipSummary: true,
    });

    this.profiles.set("AI", {
      name: "AI",
      maxDepth: 3,
      includeBreadcrumbs: true,
      includeParentChain: true,
      includeNeighborhood: true,
      includeRelationshipSummary: true,
    });
  }

  public getProfile(name?: string): ContextProfileConfig {
    return this.profiles.get(name || "Minimal") || this.profiles.get("Minimal")!;
  }
}
