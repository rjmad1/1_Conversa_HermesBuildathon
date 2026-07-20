import type { IWorkspaceProvider } from "../contracts";

export class BaseRegistry<TItem extends { id: string }> {
  protected items: Map<string, TItem> = new Map();

  public register(item: TItem): void {
    if (this.items.has(item.id)) {
      console.warn(`[BaseRegistry] Item with id '${item.id}' is already registered. Overwriting.`);
    }
    this.items.set(item.id, item);
  }

  public unregister(id: string): boolean {
    return this.items.delete(id);
  }

  public get(id: string): TItem | undefined {
    return this.items.get(id);
  }

  public has(id: string): boolean {
    return this.items.has(id);
  }

  public getAll(): TItem[] {
    return Array.from(this.items.values());
  }

  public clear(): void {
    this.items.clear();
  }
}
