import type { Repos } from "../infrastructure/repositories/in-memory";
import type { AudioStorage } from "./media/domain/storage";
import type { AudioTranscriptionProvider } from "./transcription/domain/provider";
import type { MeetingAnalysisProvider } from "./analysis/domain/provider";
import type { AuditPort } from "./audit/domain/port";
import type { Identity } from "../shared/security/identity";
import type { AppEnv } from "../shared/config/env";

export interface AppContext {
  repos: Repos;
  storage: AudioStorage;
  transcription: AudioTranscriptionProvider;
  analysis: MeetingAnalysisProvider;
  audit: AuditPort;
  identity: Identity;
  config: AppEnv;
}

export function auditMeta(ctx: AppContext, meetingId: string, correlationId: string) {
  return {
    tenantId: ctx.identity.tenantId,
    workspaceId: ctx.identity.workspaceId,
    meetingId,
    actorType: ctx.identity.actorType,
    actorId: ctx.identity.actorId,
    correlationId,
  };
}
