import { Hono, type Context } from "hono";
import { randomUUID } from "node:crypto";
import { getConfig } from "../shared/config";
import { DevIdentityAdapter, type Identity } from "../shared/security/identity";
import { buildInMemoryRepos } from "../infrastructure/repositories/in-memory";
import { InMemoryAudioStorage } from "../infrastructure/storage/in-memory";
import { TenantScopedRefBuilder } from "../modules/media/domain/storage";
import { RepoAuditPort } from "../infrastructure/audit/repo-audit-port";
import { buildProviders } from "../infrastructure/providers/factory";
import type { AppContext } from "../modules/app-context";
import { AppError, ErrorCode } from "../shared/errors/AppError";
import { logger } from "../shared/logging/logger";
import { liveness, readiness } from "../shared/observability/health";
import { CreateMeeting } from "../modules/meetings/application/create-meeting";
import { GetMeeting } from "../modules/meetings/application/get-meeting";
import { SubmitMeetingTranscript } from "../modules/meetings/application/submit-transcript";
import { UploadMeetingAudio } from "../modules/media/application/upload-audio";
import { TranscribeMeetingAudio } from "../modules/transcription/application/transcribe-audio";
import { AnalyzeMeetingTranscript } from "../modules/analysis/application/analyze-transcript";
import { GetMeetingAnalysis } from "../modules/analysis/application/get-analysis";
import { ApproveProposedAction, RejectProposedAction } from "../modules/approvals/application/approve-reject";
import { ListMeetingAuditEvents } from "../modules/audit/application/list-audit";
import { RunMeetingAgency } from "../modules/agency/application/run-meeting-agency";
import { auditMeta } from "../modules/app-context";

type AppVars = { correlationId: string };
type AppEnv = { Variables: AppVars };

export function buildApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  const cfg = getConfig();
  const repos = buildInMemoryRepos();
  const storage = new InMemoryAudioStorage(new TenantScopedRefBuilder());
  const providers = buildProviders(cfg);
  const audit = new RepoAuditPort(repos.audit);
  const identity = new DevIdentityAdapter(cfg.AUTH_MODE);

  app.onError((err, c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message, details: err.details, retryable: err.retryable }, correlationId }, err.httpStatus as 400);
    }
    logger.error({ correlationId, outcome: "failure" }, "unhandled error: " + (err as Error).message);
    return c.json({ error: { code: ErrorCode.INTERNAL, message: "Internal error" }, correlationId }, 500);
  });

  app.use("*", async (c, next) => {
    c.set("correlationId", randomUUID());
    await next();
  });

  function ctx(c: Context<AppEnv>): AppContext {
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
    const id: Identity = identity.resolve(headers);
    return { repos, storage, transcription: providers.transcription, analysis: providers.analysis, audit, identity: id, config: cfg };
  }

  app.get("/api/health/live", (c) => c.json(liveness()));
  app.get("/api/health/ready", async (c) => c.json(await readiness({ persistence: { ready: async () => true } })));

  const v1 = new Hono<AppEnv>();

  v1.post("/meetings", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => null);
    const meeting = await new CreateMeeting(ctx(c)).execute(body, correlationId);
    return c.json({ data: meeting, correlationId }, 201);
  });

  v1.get("/meetings/:meetingId", async (c) => {
    const meeting = await new GetMeeting(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: meeting, correlationId: c.get("correlationId") });
  });

  v1.post("/meetings/:meetingId/audio", async (c) => {
    const correlationId = c.get("correlationId");
    const form = await c.req.parseBody({ all: true }).catch(() => null);
    const file = form?.["file"];
    if (!file || typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== "function") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing audio file", 400);
    }
    const f = file as File;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const asset = await new UploadMeetingAudio(ctx(c)).execute(
      c.req.param("meetingId"),
      { file: { bytes, fileName: f.name, mimeType: f.type || "application/octet-stream" } },
      correlationId,
    );
    return c.json({ data: asset, correlationId }, 201);
  });

  v1.post("/meetings/:meetingId/transcript", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => ({}));
    const transcript = await new SubmitMeetingTranscript(ctx(c)).execute(c.req.param("meetingId"), body ?? {}, correlationId);
    return c.json({ data: transcript, correlationId }, 201);
  });

  v1.post("/meetings/:meetingId/transcription", async (c) => {
    const t = await new TranscribeMeetingAudio(ctx(c)).execute(c.req.param("meetingId"), c.get("correlationId"));
    return c.json({ data: t, correlationId: c.get("correlationId") });
  });

  v1.post("/meetings/:meetingId/analysis", async (c) => {
    const a = await new AnalyzeMeetingTranscript(ctx(c)).execute(c.req.param("meetingId"), c.get("correlationId"));
    return c.json({ data: a, correlationId: c.get("correlationId") }, 201);
  });

  v1.get("/meetings/:meetingId/analysis", async (c) => {
    const a = await new GetMeetingAnalysis(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: a, correlationId: c.get("correlationId") });
  });

  v1.get("/meetings/:meetingId/audit", async (c) => {
    const events = await new ListMeetingAuditEvents(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: events, correlationId: c.get("correlationId") });
  });

  v1.post("/actions/:actionId/approve", async (c) => {
    await new ApproveProposedAction(ctx(c)).execute(c.req.param("actionId"), c.get("correlationId"));
    return c.json({ data: { approved: true }, correlationId: c.get("correlationId") });
  });

  v1.post("/actions/:actionId/reject", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    await new RejectProposedAction(ctx(c)).execute(c.req.param("actionId"), (body as { reason?: string })?.reason ?? "", c.get("correlationId"));
    return c.json({ data: { rejected: true }, correlationId: c.get("correlationId") });
  });

  // Agency Control endpoints
  v1.post("/meetings/:meetingId/agency/run", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => ({}));
    const run = await new RunMeetingAgency(ctx(c)).execute(c.req.param("meetingId"), correlationId, body);
    return c.json({ data: run, correlationId }, 201);
  });

  v1.get("/agency/runs", async (c) => {
    const context = ctx(c);
    const agentRole = c.req.query("agentRole");
    const status = c.req.query("status");
    const runs = await (context.repos as any).agencyRun.list(context.identity.tenantId, context.identity.workspaceId, { agentRole, status });
    return c.json({ data: runs, correlationId: c.get("correlationId") });
  });

  v1.get("/agency/runs/:runId", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId");
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    const steps = await (context.repos as any).agencyRun.listSteps(context.identity.tenantId, context.identity.workspaceId, runId);
    return c.json({ data: { run, steps }, correlationId: c.get("correlationId") });
  });

  v1.post("/agency/runs/:runId/approve", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId");
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    run.status = "COMPLETED";
    run.finalOutcome = "APPROVED";
    await (context.repos as any).agencyRun.save(run);

    await context.audit.record({
      ...auditMeta(context, run.meetingId, c.get("correlationId")),
      entityType: "AGENCY_RUN",
      entityId: runId,
      eventType: "FINAL_OUTPUT_APPROVED",
      metadata: {},
    });

    return c.json({ data: { approved: true }, correlationId: c.get("correlationId") });
  });

  v1.post("/agency/runs/:runId/reject", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId");
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    run.status = "COMPLETED";
    run.finalOutcome = "REJECTED";
    await (context.repos as any).agencyRun.save(run);

    await context.audit.record({
      ...auditMeta(context, run.meetingId, c.get("correlationId")),
      entityType: "AGENCY_RUN",
      entityId: runId,
      eventType: "FINAL_OUTPUT_REJECTED",
      metadata: {},
    });

    return c.json({ data: { rejected: true }, correlationId: c.get("correlationId") });
  });

  v1.post("/agency/runs/:runId/steps/:stepId/retry", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId");
    const stepId = c.req.param("stepId");
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    const step = await (context.repos as any).agencyRun.getStep(context.identity.tenantId, context.identity.workspaceId, stepId);
    if (!step) {
      throw new AppError(ErrorCode.NOT_FOUND, "Step not found", 404);
    }

    // Mark step as completed and run as active again
    step.status = "COMPLETED";
    step.errorCode = null;
    step.escalationReason = null;
    await (context.repos as any).agencyRun.saveStep(step);

    run.status = "RUNNING";
    await (context.repos as any).agencyRun.save(run);

    return c.json({ data: { retried: true }, correlationId: c.get("correlationId") });
  });

  app.route("/api/v1", v1);
  return app;
}
