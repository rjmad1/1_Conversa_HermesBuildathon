import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import type { AnalysisRun, MeetingAnalysis } from "../../../shared/validation/schemas";
import { MeetingAnalysisSchema } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/logging/logger";
import { LinkupGroundingProvider } from "../../../infrastructure/providers/linkup";

export class AnalyzeMeetingTranscript {
  constructor(private readonly ctx: AppContext) {}

  async execute(meetingId: string, correlationId: string): Promise<MeetingAnalysis> {
    const transcripts = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const transcript = transcripts.find((t) => t.status === "READY");
    if (!transcript) throw new AppError(ErrorCode.VALIDATION_ERROR, "No valid transcript to analyze", 400);

    const idempotencyKey = `analyze:${transcript.id}`;
    const existingRun = await this.ctx.repos.analysisRun.findByIdempotencyKey(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, idempotencyKey);
    if (existingRun && existingRun.status === "COMPLETED") {
      const existing = await this.ctx.repos.meetingAnalysis.getByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
      if (existing) return existing;
    }

    const runId = randomUUID();
    const start = Date.now();
    const run: AnalysisRun = {
      id: runId,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      transcriptId: transcript.id,
      provider: this.ctx.analysis.name,
      model: this.ctx.analysis.name === "openai" ? this.ctx.config.ANALYSIS_MODEL : "fake",
      status: "RUNNING",
      idempotencyKey,
      startedAt: new Date().toISOString(),
      completedAt: null,
      latencyMs: null,
      tokenUsage: null,
      errorCode: null,
    };
    await this.ctx.repos.analysisRun.save(run);

    try {
      const result = await this.ctx.analysis.analyze({ transcriptContent: transcript.content, language: transcript.language, meetingId, correlationId });
      const validated = MeetingAnalysisSchema.safeParse(result);
      if (!validated.success) {
        throw new AppError(ErrorCode.ANALYSIS_FAILED, "Malformed analysis output rejected", 422);
      }
      const analysis: MeetingAnalysis = { ...validated.data, id: randomUUID(), meetingId };
      const grounding = new LinkupGroundingProvider(this.ctx.config.LINKUP_API_KEY);
      for (const a of analysis.proposedActions) {
        const urls = await grounding.search(a.description);
        if (urls.length > 0) {
          a.sourceEvidence += "\n\nGrounding Links:\n" + urls.map(url => `- [Grounding Source](${url})`).join("\n");
        }
      }

      await this.ctx.repos.meetingAnalysis.save(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, analysis);
      for (const d of analysis.decisions) await this.ctx.repos.meetingAnalysis.saveDecision(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, d);
      for (const a of analysis.proposedActions) await this.ctx.repos.meetingAnalysis.saveAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, a);

      run.status = "COMPLETED";
      run.completedAt = new Date().toISOString();
      run.latencyMs = Date.now() - start;
      await this.ctx.repos.analysisRun.save(run);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING_ANALYSIS",
        entityId: analysis.id,
        eventType: "ANALYSIS_COMPLETED",
        metadata: { decisions: analysis.decisions.length, actions: analysis.proposedActions.length },
      });
      logger.info({ operation: "AnalyzeMeetingTranscript", correlationId, outcome: "success", durationMs: run.latencyMs }, "analysis complete");
      return analysis;
    } catch (err) {
      run.status = "FAILED";
      run.completedAt = new Date().toISOString();
      run.errorCode = (err as AppError).code ?? ErrorCode.ANALYSIS_FAILED;
      await this.ctx.repos.analysisRun.save(run);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING",
        entityId: meetingId,
        eventType: "ANALYSIS_FAILED",
        metadata: { error: String((err as Error).message) },
      });
      logger.error({ operation: "AnalyzeMeetingTranscript", correlationId, outcome: "failure" }, "analysis failed");
      if (err instanceof AppError) throw err;
      throw new AppError(ErrorCode.ANALYSIS_FAILED, "Analysis failed; meeting remains recoverable", 502, undefined, true);
    }
  }
}
