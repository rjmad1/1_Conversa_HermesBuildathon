/**
 * AegisOS Provider Adapter Implementation.
 * Demonstrates platform portability by wiring AegisOS Kernel services into Interaction Intelligence ports.
 */
import type { IAegisOSProviderAdapter } from "../../domain/ports/provider-ports";
import {
  InMemorySessionMemoryStore,
  InMemorySpatialHistoryStore,
  InMemoryContextStackStore,
  InMemoryEntityPreviewStore,
  InMemoryActivityStreamStore,
  InMemoryWorkspaceDNAStore,
} from "./in-memory-adapters";

export class AegisOSProviderAdapter implements IAegisOSProviderAdapter {
  public providerName = "AegisOS-Kernel-Provider-v1.0";

  public sessionStore = new InMemorySessionMemoryStore();
  public spatialStore = new InMemorySpatialHistoryStore();
  public contextStore = new InMemoryContextStackStore();
  public previewStore = new InMemoryEntityPreviewStore();
  public activityStore = new InMemoryActivityStreamStore();
  public dnaStore = new InMemoryWorkspaceDNAStore();

  public async isAegisAvailable(): Promise<boolean> {
    return true;
  }
}
