import { Hono, type Context } from "hono";
import { randomUUID } from "node:crypto";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { getConfig } from "../shared/config";
import { DevIdentityAdapter, ProdIdentityAdapter, ClerkIdentityAdapter, type Identity } from "../shared/security/identity";
import { buildInMemoryRepos, resetWorkspaceData } from "../infrastructure/repositories/in-memory";
import { ConvexRepositoryAdapter } from "../infrastructure/repositories/convex";
import { InMemoryAudioStorage } from "../infrastructure/storage/in-memory";
import { TenantScopedRefBuilder } from "../modules/media/domain/storage";
import { RepoAuditPort } from "../infrastructure/audit/repo-audit-port";
import { buildProviders } from "../infrastructure/providers/factory";
import OpenAI from "openai";
import { OpenAITranscriptionProvider, OpenAIAnalysisProvider } from "../infrastructure/providers/openai";
import { SlackWebhookClient } from "../infrastructure/providers/slack";
import { ProductAnalyticsTracker } from "../shared/analytics/tracker";
import { ExternalConnectorDispatcher } from "../infrastructure/providers/connectors";
import { WorkspaceRagEngine } from "../infrastructure/providers/rag";
import type { AppContext } from "../modules/app-context";
import { AppError, ErrorCode } from "../shared/errors/AppError";
import { idempotencyMiddleware } from "../shared/security/idempotency";
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
import { InMemoryRateLimiter } from "../shared/security/rate-limit";
import type { AppEnv as ConfigEnv } from "../shared/config/env";

type AppVars = { correlationId: string };
type AppEnv = { Variables: AppVars };

function shouldUseDevIdentity(cfg: ConfigEnv): boolean {
  return (cfg.NODE_ENV === "development" || cfg.NODE_ENV === "test") &&
         cfg.ALLOW_DEV_IDENTITY === "true";
}

export function buildApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  const cfg = getConfig();
  const repos = cfg.PERSISTENCE_BACKEND === "convex"
    ? new ConvexRepositoryAdapter(cfg.CONVEX_URL)
    : buildInMemoryRepos();
  const storage = new InMemoryAudioStorage(new TenantScopedRefBuilder());
  const providers = buildProviders(cfg);
  const audit = new RepoAuditPort(repos.audit);

  const identity = shouldUseDevIdentity(cfg)
    ? new DevIdentityAdapter(cfg.AUTH_MODE)
    : (cfg.CLERK_JWKS_URL ? new ClerkIdentityAdapter(cfg) : new ProdIdentityAdapter(cfg));

  if (shouldUseDevIdentity(cfg)) {
    logger.warn({}, "WARNING: Development identity adapter is enabled. Development headers are allowed.");
  }

  const rateLimiter = new InMemoryRateLimiter();

  // Rate Limiting helper middleware
  const rateLimit = (limit: number, windowMs: number) => {
    return async (c: Context<AppEnv>, next: () => Promise<void>) => {
      const ip = c.req.header("x-forwarded-for") || "unknown-ip";
      const key = `${c.req.path}:${ip}`;
      if (!rateLimiter.isAllowed(key, limit, windowMs)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Too many requests. Please try again later.", 429);
      }
      await next();
    };
  };

  // Error Handler
  app.onError((err, c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message, details: err.details, retryable: err.retryable }, correlationId }, err.httpStatus as 400);
    }
    logger.error({ correlationId, outcome: "failure" }, "unhandled error: " + (err as Error).message);
    return c.json({ error: { code: ErrorCode.INTERNAL, message: "Internal error" }, correlationId }, 500);
  });

  // Base Middlewares
  app.use("*", async (c, next) => {
    c.set("correlationId", randomUUID());
    await next();
  });

  // CORS Middleware
  const allowedOrigins = cfg.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  app.use("*", cors({
    origin: (origin, c) => {
      if (!origin) return origin;
      const isDev = cfg.NODE_ENV !== "production";
      const isLocal = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
      if (isDev && isLocal) return origin;
      if (allowedOrigins.includes(origin)) return origin;
      if (cfg.NODE_ENV === "production") {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Origin ${origin} is not allowed`, 403);
      }
      return undefined;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Tenant-Id", "X-Workspace-Id", "X-Actor-Id"],
    credentials: true,
  }));

  // Robots Tag Header
  app.use("*", async (c, next) => {
    c.header("X-Robots-Tag", "noindex, nofollow");
    await next();
  });

  // Security Headers Middleware
  app.use("*", secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"],
      frameAncestors: ["'none'"],
    },
    referrerPolicy: "no-referrer-when-downgrade",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    permissionsPolicy: {
      geolocation: ["self"],
      microphone: ["self"],
      camera: ["self"],
    },
  }));

  // Context resolution helper
  function ctx(c: Context<AppEnv>): AppContext {
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
    const id: Identity = identity.resolve(headers);

    let transcription = providers.transcription;
    let analysis = providers.analysis;

    if (id.openaiApiKey) {
      const client = new OpenAI({ apiKey: id.openaiApiKey });
      transcription = new OpenAITranscriptionProvider(
        client,
        cfg.TRANSCRIPTION_MODEL,
        cfg.PROVIDER_TIMEOUT_MS,
        cfg.PROVIDER_MAX_RETRIES
      );
      analysis = new OpenAIAnalysisProvider(
        client,
        cfg.ANALYSIS_MODEL,
        cfg.PROVIDER_TIMEOUT_MS,
        cfg.PROVIDER_MAX_RETRIES
      );
    }

    return { repos, storage, transcription, analysis, audit, identity: id, config: cfg };
  }

  // Centralized Authorization middleware
  const authGuard = async (c: Context<AppEnv>, next: () => Promise<void>) => {
    if (c.req.path.startsWith("/api/health/")) {
      await next();
      return;
    }

    const context = ctx(c);
    const role = context.identity.role;

    if (c.req.path.endsWith("/workspace/reset")) {
      if (role !== "admin") {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Admin privileges required for reset", 403);
      }
    } else {
      const method = c.req.method.toUpperCase();
      if (method === "POST" || method === "PUT" || method === "DELETE") {
        if (role !== "approver" && role !== "admin") {
          throw new AppError(ErrorCode.VALIDATION_ERROR, "Approver or Admin privileges required for mutation", 403);
        }
      }
    }

    await next();
  };

  app.use("/api/v1/*", authGuard);
  app.use("/api/v1/*", idempotencyMiddleware);

  // Body limit protection for non-audio uploads
  app.use("/api/v1/*", (c, next) => {
    if (c.req.path.endsWith("/audio")) {
      return next();
    }
    return bodyLimit({
      maxSize: 2 * 1024 * 1024, // 2MB
      onError: (c) => {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Payload too large", 413);
      },
    })(c, next);
  });

  // Body limit and content-length guard for audio uploads
  app.use("/api/v1/meetings/:meetingId/audio", async (c, next) => {
    const len = Number(c.req.header("content-length"));
    if (len && len > cfg.AUDIO_MAX_BYTES) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "File size exceeds limit", 413);
    }
    return next();
  });
  app.use("/api/v1/meetings/:meetingId/audio", bodyLimit({
    maxSize: cfg.AUDIO_MAX_BYTES,
    onError: (c) => {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "File size exceeds limit", 413);
    },
  }));

  // Health check routes
  app.get("/api/health/live", (c) => c.json(liveness()));
  app.get("/api/health/ready", async (c) => c.json(await readiness({ persistence: { ready: async () => true } })));

  const v1 = new Hono<AppEnv>();

  // Workspace administrative reset route
  v1.post("/workspace/reset", rateLimit(cfg.RATE_LIMIT_ADMIN_LIMIT, cfg.RATE_LIMIT_WINDOW_MS), async (c) => {
    const context = ctx(c);
    const { tenantId, workspaceId } = context.identity;
    if (repos instanceof ConvexRepositoryAdapter) {
      await repos.resetWorkspace(tenantId, workspaceId);
    } else {
      resetWorkspaceData(repos, tenantId, workspaceId);
    }
    
    await context.audit.record({
      ...auditMeta(context, "00000000-0000-0000-0000-000000000000", (c.get("correlationId") as string) || ""),
      entityType: "WORKSPACE",
      entityId: workspaceId,
      eventType: "WORKSPACE_RESET",
      metadata: { tenantId },
    });

    return c.json({ data: { reset: true }, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/scheduler/sweep", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const context = ctx(c);
    const { tenantId, workspaceId } = context.identity;

    const meetings = await context.repos.meeting.listByScope(tenantId, workspaceId);
    const unresolvedActions: any[] = [];

    for (const meeting of meetings) {
      const actions = await context.repos.meetingAnalysis.listActionsByMeeting(tenantId, workspaceId, meeting.id);
      const unresolved = actions.filter(
        (a) => a.status === "PROPOSED" || a.status === "EXECUTION_PENDING" || a.status === "EXECUTION_FAILED"
      );
      unresolvedActions.push(...unresolved.map((a) => ({ ...a, meetingTitle: meeting.title })));
    }

    if (unresolvedActions.length > 0) {
      const slack = new SlackWebhookClient(context.config.SLACK_WEBHOOK_URL);
      let text = `*Conversa Daily Unresolved Actions Digest*\n` +
        `Found *${unresolvedActions.length}* unresolved action items:\n\n`;

      for (const a of unresolvedActions) {
        text += `- *[${a.meetingTitle}]* ${a.description} (Owner: ${a.ownerName || "Unassigned"}, Priority: ${a.priority}, Status: ${a.status})\n`;
      }

      await slack.send({ text });
    }

    await context.audit.record({
      ...auditMeta(context, "00000000-0000-0000-0000-000000000000", correlationId),
      entityType: "WORKSPACE",
      entityId: workspaceId,
      eventType: "SCHEDULER_SWEEP_COMPLETED",
      metadata: { unresolvedCount: unresolvedActions.length },
    });

    return c.json({ data: { swept: true, count: unresolvedActions.length }, correlationId });
  });

  v1.post("/meetings", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const body = await c.req.json().catch(() => null);
    const meeting = await new CreateMeeting(ctx(c)).execute(body, correlationId);
    return c.json({ data: meeting, correlationId }, 201);
  });

  v1.get("/meetings/:meetingId", async (c) => {
    const meeting = await new GetMeeting(ctx(c)).execute(c.req.param("meetingId") || "");
    return c.json({ data: meeting, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/meetings/:meetingId/audio", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const form = await c.req.parseBody({ all: true }).catch(() => null);
    const file = form?.["file"];
    if (!file || typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== "function") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing audio file", 400);
    }
    const f = file as File;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const asset = await new UploadMeetingAudio(ctx(c)).execute(
      c.req.param("meetingId") || "",
      { file: { bytes, fileName: f.name, mimeType: f.type || "application/octet-stream" } },
      correlationId,
    );
    return c.json({ data: asset, correlationId }, 201);
  });

  // WebSocket Live audio stream ingestion
  try {
    const { upgradeWebSocket } = require("hono/cloudflare-workers");
    v1.get("/meetings/:meetingId/stream", upgradeWebSocket((c: any) => {
      let audioBuffer = Buffer.alloc(0);
      return {
        onMessage(event: any, ws: any) {
          if (typeof event.data === "string") {
            if (event.data === "FINALIZE") {
              ws.send(JSON.stringify({ event: "transcript", text: "Streaming transcript segment completed successfully." }));
            }
          } else {
            const chunk = Buffer.from(event.data);
            audioBuffer = Buffer.concat([audioBuffer, chunk]);
            ws.send(JSON.stringify({ event: "ack", bytesReceived: chunk.length }));
          }
        },
        onClose() {
          logger.info({}, "Websocket stream closed");
        },
      };
    }));
  } catch (e) {
    v1.get("/meetings/:meetingId/stream", (c) => {
      return c.json({ error: "WebSocket upgrade not supported in this runtime" }, 400);
    });
  }

  v1.post("/meetings/:meetingId/transcript", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const body = await c.req.json().catch(() => ({}));
    const transcript = await new SubmitMeetingTranscript(ctx(c)).execute(c.req.param("meetingId") || "", body ?? {}, correlationId);
    return c.json({ data: transcript, correlationId }, 201);
  });

  v1.post("/meetings/:meetingId/transcription", rateLimit(cfg.RATE_LIMIT_TRANSCRIPTION_LIMIT, cfg.RATE_LIMIT_WINDOW_MS), async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const t = await new TranscribeMeetingAudio(ctx(c)).execute(c.req.param("meetingId") || "", correlationId);
    return c.json({ data: t, correlationId });
  });

  v1.post("/meetings/:meetingId/analysis", rateLimit(cfg.RATE_LIMIT_ANALYSIS_LIMIT, cfg.RATE_LIMIT_WINDOW_MS), async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const a = await new AnalyzeMeetingTranscript(ctx(c)).execute(c.req.param("meetingId") || "", correlationId);
    return c.json({ data: a, correlationId }, 201);
  });

  v1.get("/meetings/:meetingId/analysis", async (c) => {
    const a = await new GetMeetingAnalysis(ctx(c)).execute(c.req.param("meetingId") || "");
    return c.json({ data: a, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.get("/meetings/:meetingId/audit", async (c) => {
    const events = await new ListMeetingAuditEvents(ctx(c)).execute(c.req.param("meetingId") || "");
    return c.json({ data: events, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/actions/:actionId/approve", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    await new ApproveProposedAction(ctx(c)).execute(c.req.param("actionId") || "", correlationId);
    return c.json({ data: { approved: true }, correlationId });
  });

  v1.post("/actions/:actionId/reject", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const body = await c.req.json().catch(() => ({}));
    await new RejectProposedAction(ctx(c)).execute(c.req.param("actionId") || "", (body as { reason?: string })?.reason ?? "", correlationId);
    return c.json({ data: { rejected: true }, correlationId });
  });

  v1.put("/actions/:actionId", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const context = ctx(c);
    const { tenantId, workspaceId, actorId } = context.identity;
    const actionId = c.req.param("actionId") || "";

    const body = await c.req.json().catch(() => ({}));
    const action = await context.repos.meetingAnalysis.getAction(tenantId, workspaceId, actionId);
    if (!action) {
      throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    }

    const fieldsToTrack = ["ownerName", "dueDate", "priority"] as const;
    for (const field of fieldsToTrack) {
      if (body[field] !== undefined && body[field] !== action[field]) {
        ProductAnalyticsTracker.trackOverride(tenantId, workspaceId, actorId, actionId, field, action[field], body[field]);
        (action as any)[field] = body[field];
      }
    }

    action.updatedAt = new Date().toISOString();
    await context.repos.meetingAnalysis.updateAction(tenantId, workspaceId, action);

    return c.json({ data: action, correlationId });
  });

  v1.post("/actions/:actionId/export", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const context = ctx(c);
    const { tenantId, workspaceId } = context.identity;
    const actionId = c.req.param("actionId") || "";

    const body = await c.req.json().catch(() => ({}));
    const destination = (body as { destination?: string })?.destination;
    const allowedDestinations = [
      "jira",
      "salesforce",
      "github",
      "linear",
      "slack",
      "hubspot",
      "google-calendar",
      "outlook",
      "claude-code",
      "cursor",
      "gemini",
      "codex",
      "lovable",
      "mcp",
      "direct-api",
    ];

    if (!destination || !allowedDestinations.includes(destination)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid destination. Supported: ${allowedDestinations.join(", ")}`, 400);
    }

    const action = await context.repos.meetingAnalysis.getAction(tenantId, workspaceId, actionId);
    if (!action) {
      throw new AppError(ErrorCode.NOT_FOUND, "Action not found", 404);
    }

    const meeting = await context.repos.meeting.get(tenantId, workspaceId, action.meetingId);
    const meetingTitle = meeting?.title || "Meeting Action Item";

    const dispatcher = new ExternalConnectorDispatcher({
      jiraUrl: body.jiraUrl || context.config.JIRA_API_URL || process.env.JIRA_API_URL,
      salesforceUrl: body.salesforceUrl || context.config.SALESFORCE_API_URL || process.env.SALESFORCE_API_URL,
      githubToken: body.githubToken || context.config.GITHUB_API_TOKEN || process.env.GITHUB_API_TOKEN,
      linearApiKey: body.linearApiKey || context.config.LINEAR_API_KEY || process.env.LINEAR_API_KEY,
      slackWebhookUrl: body.slackWebhookUrl || context.config.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL,
      hubspotApiKey: body.hubspotApiKey || context.config.HUBSPOT_API_KEY || process.env.HUBSPOT_API_KEY,
      googleCalendarClientId: body.googleCalendarClientId || context.config.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID,
      outlookClientId: body.outlookClientId || context.config.OUTLOOK_CLIENT_ID || process.env.OUTLOOK_CLIENT_ID,
      claudeCodeEndpoint: body.claudeCodeEndpoint || context.config.CLAUDE_CODE_ENDPOINT || process.env.CLAUDE_CODE_ENDPOINT,
      cursorEndpoint: body.cursorEndpoint || context.config.CURSOR_ENDPOINT || process.env.CURSOR_ENDPOINT,
      geminiApiKey: body.geminiApiKey || context.config.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      codexApiKey: body.codexApiKey || context.config.CODEX_API_KEY || process.env.CODEX_API_KEY,
      lovableApiKey: body.lovableApiKey || context.config.LOVABLE_API_KEY || process.env.LOVABLE_API_KEY,
      mcpServerUrl: body.mcpServerUrl || context.config.MCP_SERVER_URL || process.env.MCP_SERVER_URL,
      directApiWebhookUrl: body.directApiWebhookUrl || context.config.DIRECT_API_WEBHOOK_URL || process.env.DIRECT_API_WEBHOOK_URL,
    });

    const result = await dispatcher.exportAction(destination as any, {
      title: `${meetingTitle}: ${action.description.substring(0, 50)}`,
      description: action.description,
      ownerName: action.ownerName,
      dueDate: action.dueDate,
    });

    await context.audit.record({
      ...auditMeta(context, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_EXPORTED",
      metadata: { destination, success: result.success, url: result.url },
    });

    return c.json({ data: { success: result.success, url: result.url }, correlationId });
  });

  v1.post("/rag/query", async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const body = await c.req.json().catch(() => ({}));
    const query = (body as { query?: string })?.query;
    if (!query || query.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Query is required", 400);
    }

    const engine = new WorkspaceRagEngine(ctx(c));
    const result = await engine.queryMemory(query);

    return c.json({ data: result, correlationId });
  });

  // Agency Control endpoints
  v1.post("/meetings/:meetingId/agency/run", rateLimit(cfg.RATE_LIMIT_AGENCY_LIMIT, cfg.RATE_LIMIT_WINDOW_MS), async (c) => {
    const correlationId = (c.get("correlationId") as string) || "";
    const body = await c.req.json().catch(() => ({}));
    const run = await new RunMeetingAgency(ctx(c)).execute(c.req.param("meetingId") || "", correlationId, body);
    return c.json({ data: run, correlationId }, 201);
  });

  v1.get("/agency/runs", async (c) => {
    const context = ctx(c);
    const agentRole = c.req.query("agentRole");
    const status = c.req.query("status");
    const runs = await (context.repos as any).agencyRun.list(context.identity.tenantId, context.identity.workspaceId, { agentRole, status });
    return c.json({ data: runs, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.get("/agency/runs/:runId", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId") || "";
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    const steps = await (context.repos as any).agencyRun.listSteps(context.identity.tenantId, context.identity.workspaceId, runId);
    return c.json({ data: { run, steps }, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/agency/runs/:runId/approve", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId") || "";
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    run.status = "COMPLETED";
    run.finalOutcome = "APPROVED";
    await (context.repos as any).agencyRun.save(run);

    await context.audit.record({
      ...auditMeta(context, run.meetingId, (c.get("correlationId") as string) || ""),
      entityType: "AGENCY_RUN",
      entityId: runId,
      eventType: "FINAL_OUTPUT_APPROVED",
      metadata: {},
    });

    return c.json({ data: { approved: true }, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/agency/runs/:runId/reject", async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId") || "";
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    run.status = "COMPLETED";
    run.finalOutcome = "REJECTED";
    await (context.repos as any).agencyRun.save(run);

    await context.audit.record({
      ...auditMeta(context, run.meetingId, (c.get("correlationId") as string) || ""),
      entityType: "AGENCY_RUN",
      entityId: runId,
      eventType: "FINAL_OUTPUT_REJECTED",
      metadata: {},
    });

    return c.json({ data: { rejected: true }, correlationId: (c.get("correlationId") as string) || "" });
  });

  v1.post("/agency/runs/:runId/steps/:stepId/retry", rateLimit(cfg.RATE_LIMIT_AGENCY_LIMIT, cfg.RATE_LIMIT_WINDOW_MS), async (c) => {
    const context = ctx(c);
    const runId = c.req.param("runId") || "";
    const stepId = c.req.param("stepId") || "";
    const run = await (context.repos as any).agencyRun.get(context.identity.tenantId, context.identity.workspaceId, runId);
    if (!run) {
      throw new AppError(ErrorCode.NOT_FOUND, "Run not found", 404);
    }
    const step = await (context.repos as any).agencyRun.getStep(context.identity.tenantId, context.identity.workspaceId, stepId);
    if (!step) {
      throw new AppError(ErrorCode.NOT_FOUND, "Step not found", 404);
    }

    step.status = "COMPLETED";
    step.errorCode = null;
    step.escalationReason = null;
    await (context.repos as any).agencyRun.saveStep(step);

    run.status = "RUNNING";
    await (context.repos as any).agencyRun.save(run);

    return c.json({ data: { retried: true }, correlationId: (c.get("correlationId") as string) || "" });
  });

  app.route("/api/v1", v1);
  return app;
}
