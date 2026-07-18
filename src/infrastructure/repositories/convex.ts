import type {
  MeetingRepo,
  AudioAssetRepo,
  TranscriptRepo,
  AnalysisRunRepo,
  MeetingAnalysisRepo,
  AuditRepo,
  WaitlistRepo,
} from "../../modules/meetings/domain/repositories";
import type {
  Meeting,
  AudioAsset,
  Transcript,
  AnalysisRun,
  MeetingAnalysis,
  Decision,
  ProposedAction,
  ApprovalDecision,
  AuditEvent,
  WaitlistEntry,
} from "../../shared/validation/schemas";
import type { AgencyRunRepo } from "../../modules/agency/domain/repositories";
import type { AgencyRun, AgencyStep } from "../../modules/agency/domain/agent-run";
import { AppError, ErrorCode } from "../../shared/errors/AppError";
import { logger } from "../../shared/logging/logger";
import { buildInMemoryRepos, resetWorkspaceData } from "./in-memory";
import type { Repos } from "./in-memory";
import type {
  CompetitorRepo,
  IntelligenceSnapshotRepo,
  IntelligenceRunRepo,
  BattlecardRepo,
} from "../../modules/competitive-intelligence/domain/ports";
import type { Competitor } from "../../modules/competitive-intelligence/domain/competitor";
import type { IntelligenceSnapshot } from "../../modules/competitive-intelligence/domain/intelligence-snapshot";
import type { IntelligenceRun } from "../../modules/competitive-intelligence/domain/intelligence-run";
import type { Battlecard } from "../../modules/competitive-intelligence/domain/battlecard";
import type { ChatRepo, ChatSession, ChatMessage } from "../../modules/analysis/domain/chat";

export class ConvexRepositoryAdapter implements Repos {
  meeting: MeetingRepo;
  audio: AudioAssetRepo;
  transcript: TranscriptRepo;
  analysisRun: AnalysisRunRepo;
  meetingAnalysis: MeetingAnalysisRepo;
  audit: AuditRepo;
  agencyRun: AgencyRunRepo;
  waitlist: WaitlistRepo;
  competitor: CompetitorRepo;
  intelligenceSnapshot: IntelligenceSnapshotRepo;
  intelligenceRun: IntelligenceRunRepo;
  battlecard: BattlecardRepo;
  chat: ChatRepo;

  private fallback: Repos;
  private convexUrl: string | null;

  constructor(convexUrl?: string) {
    this.convexUrl = convexUrl || null;
    this.fallback = buildInMemoryRepos();

    if (this.convexUrl) {
      logger.info({ convexUrl: this.convexUrl }, "Initializing Convex Persistence client");
    } else {
      logger.info({}, "Convex URL not provided. Using in-memory fallback persistence.");
    }

    const self = this;

    // 1. MeetingRepo
    this.meeting = {
      async save(m: Meeting): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/meetings/save", { meeting: m });
        } else {
          await self.fallback.meeting.save(m);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<Meeting | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/meetings/get", { tenantId, workspaceId, id });
        }
        return self.fallback.meeting.get(tenantId, workspaceId, id);
      },
      async listByScope(tenantId: string, workspaceId: string): Promise<Meeting[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/meetings/listByScope", { tenantId, workspaceId }) || [];
        }
        return self.fallback.meeting.listByScope(tenantId, workspaceId);
      }
    };

    // 2. AudioAssetRepo
    this.audio = {
      async save(a: AudioAsset): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/audio/save", { audio: a });
        } else {
          await self.fallback.audio.save(a);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<AudioAsset | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/audio/get", { tenantId, workspaceId, id });
        }
        return self.fallback.audio.get(tenantId, workspaceId, id);
      },
      async findByChecksum(tenantId: string, workspaceId: string, meetingId: string, checksum: string): Promise<AudioAsset | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/audio/findByChecksum", { tenantId, workspaceId, meetingId, checksum });
        }
        return self.fallback.audio.findByChecksum(tenantId, workspaceId, meetingId, checksum);
      },
      async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AudioAsset[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/audio/findByMeeting", { tenantId, workspaceId, meetingId }) || [];
        }
        return self.fallback.audio.findByMeeting(tenantId, workspaceId, meetingId);
      }
    };

    // 3. TranscriptRepo
    this.transcript = {
      async save(t: Transcript): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/transcripts/save", { transcript: t });
        } else {
          await self.fallback.transcript.save(t);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<Transcript | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/transcripts/get", { tenantId, workspaceId, id });
        }
        return self.fallback.transcript.get(tenantId, workspaceId, id);
      },
      async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<Transcript[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/transcripts/findByMeeting", { tenantId, workspaceId, meetingId }) || [];
        }
        return self.fallback.transcript.findByMeeting(tenantId, workspaceId, meetingId);
      }
    };

    // 4. AnalysisRunRepo
    this.analysisRun = {
      async save(r: AnalysisRun): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/runs/save", { run: r });
        } else {
          await self.fallback.analysisRun.save(r);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<AnalysisRun | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/runs/get", { tenantId, workspaceId, id });
        }
        return self.fallback.analysisRun.get(tenantId, workspaceId, id);
      },
      async findByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AnalysisRun[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/runs/findByMeeting", { tenantId, workspaceId, meetingId }) || [];
        }
        return self.fallback.analysisRun.findByMeeting(tenantId, workspaceId, meetingId);
      },
      async findByIdempotencyKey(tenantId: string, workspaceId: string, key: string): Promise<AnalysisRun | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/runs/findByIdempotencyKey", { tenantId, workspaceId, key });
        }
        return self.fallback.analysisRun.findByIdempotencyKey(tenantId, workspaceId, key);
      }
    };

    // 5. MeetingAnalysisRepo
    this.meetingAnalysis = {
      async save(tenantId: string, workspaceId: string, a: MeetingAnalysis): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/analysis/save", { tenantId, workspaceId, analysis: a });
        } else {
          await self.fallback.meetingAnalysis.save(tenantId, workspaceId, a);
        }
      },
      async getByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<MeetingAnalysis | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/analysis/getByMeeting", { tenantId, workspaceId, meetingId });
        }
        return self.fallback.meetingAnalysis.getByMeeting(tenantId, workspaceId, meetingId);
      },
      async getByRun(tenantId: string, workspaceId: string, runId: string): Promise<MeetingAnalysis | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/analysis/getByRun", { tenantId, workspaceId, runId });
        }
        return self.fallback.meetingAnalysis.getByRun(tenantId, workspaceId, runId);
      },
      async saveDecision(tenantId: string, workspaceId: string, d: Decision): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/analysis/saveDecision", { tenantId, workspaceId, decision: d });
        } else {
          await self.fallback.meetingAnalysis.saveDecision(tenantId, workspaceId, d);
        }
      },
      async saveAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/analysis/saveAction", { tenantId, workspaceId, action: a });
        } else {
          await self.fallback.meetingAnalysis.saveAction(tenantId, workspaceId, a);
        }
      },
      async getAction(tenantId: string, workspaceId: string, id: string): Promise<ProposedAction | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/analysis/getAction", { tenantId, workspaceId, id });
        }
        return self.fallback.meetingAnalysis.getAction(tenantId, workspaceId, id);
      },
      async updateAction(tenantId: string, workspaceId: string, a: ProposedAction): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/analysis/updateAction", { tenantId, workspaceId, action: a });
        } else {
          await self.fallback.meetingAnalysis.updateAction(tenantId, workspaceId, a);
        }
      },
      async saveApproval(tenantId: string, workspaceId: string, p: ApprovalDecision): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/analysis/saveApproval", { tenantId, workspaceId, approval: p });
        } else {
          await self.fallback.meetingAnalysis.saveApproval(tenantId, workspaceId, p);
        }
      },
      async listActionsByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<ProposedAction[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/analysis/listActionsByMeeting", { tenantId, workspaceId, meetingId }) || [];
        }
        return self.fallback.meetingAnalysis.listActionsByMeeting(tenantId, workspaceId, meetingId);
      }
    };

    // 6. AuditRepo
    this.audit = {
      async append(e: AuditEvent): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/audit/append", { event: e });
        } else {
          await self.fallback.audit.append(e);
        }
      },
      async listByMeeting(tenantId: string, workspaceId: string, meetingId: string): Promise<AuditEvent[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/audit/listByMeeting", { tenantId, workspaceId, meetingId }) || [];
        }
        return self.fallback.audit.listByMeeting(tenantId, workspaceId, meetingId);
      }
    };

    // 7. AgencyRunRepo
    this.agencyRun = {
      async save(run: AgencyRun): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/agency/saveRun", { run });
        } else {
          await self.fallback.agencyRun.save(run);
        }
      },
      async get(tenantId: string, workspaceId: string, runId: string): Promise<AgencyRun | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/agency/getRun", { tenantId, workspaceId, runId });
        }
        return self.fallback.agencyRun.get(tenantId, workspaceId, runId);
      },
      async list(tenantId: string, workspaceId: string, filters?: { agentRole?: string; status?: string }): Promise<AgencyRun[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/agency/listRuns", { tenantId, workspaceId, filters }) || [];
        }
        return self.fallback.agencyRun.list(tenantId, workspaceId, filters);
      },
      async saveStep(step: AgencyStep): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/agency/saveStep", { step });
        } else {
          await self.fallback.agencyRun.saveStep(step);
        }
      },
      async getStep(tenantId: string, workspaceId: string, stepId: string): Promise<AgencyStep | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/agency/getStep", { tenantId, workspaceId, stepId });
        }
        return self.fallback.agencyRun.getStep(tenantId, workspaceId, stepId);
      },
      async listSteps(tenantId: string, workspaceId: string, runId: string): Promise<AgencyStep[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/agency/listSteps", { tenantId, workspaceId, runId }) || [];
        }
        return self.fallback.agencyRun.listSteps(tenantId, workspaceId, runId);
      }
    };

    // 8. WaitlistRepo
    this.waitlist = {
      async save(entry: WaitlistEntry): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/waitlist/save", { entry });
        } else {
          await self.fallback.waitlist.save(entry);
        }
      },
      async getByEmail(tenantId: string, workspaceId: string, email: string): Promise<WaitlistEntry | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/waitlist/getByEmail", { tenantId, workspaceId, email });
        }
        return self.fallback.waitlist.getByEmail(tenantId, workspaceId, email);
      },
      async list(tenantId: string, workspaceId: string): Promise<WaitlistEntry[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/waitlist/list", { tenantId, workspaceId }) || [];
        }
        return self.fallback.waitlist.list(tenantId, workspaceId);
      }
    };

    // 9. CompetitorRepo
    this.competitor = {
      async save(c: Competitor): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/intelligence/saveCompetitor", { competitor: c });
        } else {
          await self.fallback.competitor.save(c);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<Competitor | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/getCompetitor", { tenantId, workspaceId, id });
        }
        return self.fallback.competitor.get(tenantId, workspaceId, id);
      },
      async list(tenantId: string, workspaceId: string): Promise<Competitor[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/listCompetitors", { tenantId, workspaceId }) || [];
        }
        return self.fallback.competitor.list(tenantId, workspaceId);
      }
    };

    // 10. IntelligenceSnapshotRepo
    this.intelligenceSnapshot = {
      async save(s: IntelligenceSnapshot): Promise<void> {
        if (self.convexUrl) {
          await self.fallback.intelligenceSnapshot.save(s);
        }
      },
      async get(tenantId: string, workspaceId: string, id: string): Promise<IntelligenceSnapshot | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/getSnapshot", { tenantId, workspaceId, id });
        }
        return self.fallback.intelligenceSnapshot.get(tenantId, workspaceId, id);
      },
      async getLatestByCategory(tenantId: string, workspaceId: string, competitorId: string, category: string): Promise<IntelligenceSnapshot | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/getLatestSnapshotByCategory", { tenantId, workspaceId, competitorId, category });
        }
        return self.fallback.intelligenceSnapshot.getLatestByCategory(tenantId, workspaceId, competitorId, category);
      },
      async listForRun(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceSnapshot[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/listSnapshotsForRun", { tenantId, workspaceId, runId }) || [];
        }
        return self.fallback.intelligenceSnapshot.listForRun(tenantId, workspaceId, runId);
      }
    };

    // 11. IntelligenceRunRepo
    this.intelligenceRun = {
      async save(r: IntelligenceRun): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/intelligence/saveRun", { run: r });
        } else {
          await self.fallback.intelligenceRun.save(r);
        }
      },
      async get(tenantId: string, workspaceId: string, runId: string): Promise<IntelligenceRun | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/getRun", { tenantId, workspaceId, runId });
        }
        return self.fallback.intelligenceRun.get(tenantId, workspaceId, runId);
      },
      async list(tenantId: string, workspaceId: string, competitorId?: string): Promise<IntelligenceRun[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/listRuns", { tenantId, workspaceId, competitorId }) || [];
        }
        return self.fallback.intelligenceRun.list(tenantId, workspaceId, competitorId);
      }
    };

    // 12. BattlecardRepo
    this.battlecard = {
      async save(b: Battlecard): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/intelligence/saveBattlecard", { battlecard: b });
        } else {
          await self.fallback.battlecard.save(b);
        }
      },
      async get(tenantId: string, workspaceId: string, competitorId: string): Promise<Battlecard | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/intelligence/getBattlecard", { tenantId, workspaceId, competitorId });
        }
        return self.fallback.battlecard.get(tenantId, workspaceId, competitorId);
      }
    };

    // 13. ChatRepo
    this.chat = {
      async getSession(tenantId: string, workspaceId: string, id: string): Promise<ChatSession | null> {
        if (self.convexUrl) {
          return self.convexCall("queries/chat/getSession", { tenantId, workspaceId, id });
        }
        return self.fallback.chat.getSession(tenantId, workspaceId, id);
      },
      async saveSession(session: ChatSession): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/chat/saveSession", { session });
        } else {
          await self.fallback.chat.saveSession(session);
        }
      },
      async saveMessage(message: ChatMessage): Promise<void> {
        if (self.convexUrl) {
          await self.convexCall("mutations/chat/saveMessage", { message });
        } else {
          await self.fallback.chat.saveMessage(message);
        }
      },
      async listMessages(sessionId: string): Promise<ChatMessage[]> {
        if (self.convexUrl) {
          return self.convexCall("queries/chat/listMessages", { sessionId }) || [];
        }
        return self.fallback.chat.listMessages(sessionId);
      }
    };
  }

  async resetWorkspace(tenantId: string, workspaceId: string): Promise<void> {
    if (this.convexUrl) {
      await this.convexCall("mutations/workspace/reset", { tenantId, workspaceId });
    } else {
      resetWorkspaceData(this.fallback, tenantId, workspaceId);
    }
  }

  private async convexCall(path: string, body: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.convexUrl}/api/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Convex error status: ${response.status}`);
      }

      const res = await response.json();
      if (res && typeof res === "object" && "error" in res) {
        throw new Error(res.error);
      }
      return res?.value ?? res;
    } catch (err) {
      logger.error({ err, path }, "Convex HTTP call failed");
      throw new AppError(
        ErrorCode.PROVIDER_ERROR,
        `Convex database operation failed: ${(err as Error).message}`,
        502,
        undefined,
        true
      );
    }
  }
}
