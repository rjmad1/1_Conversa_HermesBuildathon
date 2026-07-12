import { buildInMemoryRepos } from "../src/infrastructure/repositories/in-memory";
import { InMemoryAudioStorage } from "../src/infrastructure/storage/in-memory";
import { TenantScopedRefBuilder } from "../src/modules/media/domain/storage";
import { RepoAuditPort } from "../src/infrastructure/audit/repo-audit-port";
import { FakeTranscriptionProvider } from "../src/infrastructure/providers/fake-transcription";
import { FakeAnalysisProvider } from "../src/infrastructure/providers/fake-analysis";
import type { AppContext } from "../src/modules/app-context";
import type { Identity } from "../src/shared/security/identity";
import { getConfig, resetConfigForTests } from "../src/shared/config";
import type { AppEnv } from "../src/shared/config/env";

export function makeIdentity(over: Partial<Identity> = {}): Identity {
  return { tenantId: "demo", workspaceId: "demo", actorId: "dev-user", actorType: "user", role: "approver", ...over };
}

export function makeContext(identity: Identity = makeIdentity(), env: Partial<AppEnv> = {}): AppContext {
  resetConfigForTests();
  const cfg = { ...getConfig(), ...env };
  // pin deterministic config for tests
  const repos = buildInMemoryRepos();
  const storage = new InMemoryAudioStorage(new TenantScopedRefBuilder());
  return {
    repos,
    storage,
    transcription: new FakeTranscriptionProvider(),
    analysis: new FakeAnalysisProvider(),
    audit: new RepoAuditPort(repos.audit),
    identity,
    config: cfg,
  };
}

export const SAMPLE_MP3 = new Uint8Array([0xff, 0xfb, 0x90, 0x00, 0x01, 0x02, 0x03, 0x04]);
