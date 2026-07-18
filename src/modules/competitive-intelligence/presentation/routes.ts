import { Hono } from "hono";
import { ConfigureCompetitor } from "../application/configure-competitor";
import { GetBattlecard } from "../application/get-battlecard";
import { RunIntelligenceSweep } from "../application/run-intelligence-sweep";
import { GetSweepStatus } from "../application/get-sweep-status";
import { ListRunLogs } from "../application/list-run-logs";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { randomUUID } from "node:crypto";

export function buildIntelligenceRoutes(ctxResolver: (c: any) => any): Hono<any> {
  const routes = new Hono<any>();

  // Configure competitor
  routes.post("/competitors", async (c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    const body = await c.req.json().catch(() => ({}));
    const context = ctxResolver(c);

    const configureUsecase = new ConfigureCompetitor(context);
    const competitor = await configureUsecase.execute(body);

    return c.json({ data: competitor, correlationId }, 201);
  });

  // Get battlecard
  routes.get("/competitors/:competitorId/battlecard", async (c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    const competitorId = c.req.param("competitorId") || "";
    const context = ctxResolver(c);

    const getUsecase = new GetBattlecard(context);
    const battlecard = await getUsecase.execute(competitorId);

    return c.json({ data: battlecard, correlationId });
  });

  // Trigger manual sweep
  routes.post("/competitors/:competitorId/sweeps", async (c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    const competitorId = c.req.param("competitorId") || "";
    const body = await c.req.json().catch(() => ({}));
    const context = ctxResolver(c);

    // Validate tenant ownership of competitor before initiating sweep
    const competitor = await context.repos.competitor.get(context.identity.tenantId, context.identity.workspaceId, competitorId);
    if (!competitor) {
      throw new AppError(ErrorCode.NOT_FOUND, "Competitor not found", 404);
    }

    const runUsecase = new RunIntelligenceSweep(context);
    const run = await runUsecase.execute(competitorId, correlationId, {
      triggerType: "manual",
      useFixture: body.useFixture,
    });

    return c.json({ data: run, correlationId }, 201);
  });

  // Get sweep run status
  routes.get("/competitors/:competitorId/sweeps/:runId/status", async (c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    const competitorId = c.req.param("competitorId") || "";
    const runId = c.req.param("runId") || "";
    const context = ctxResolver(c);

    // Validate tenant boundary
    const competitor = await context.repos.competitor.get(context.identity.tenantId, context.identity.workspaceId, competitorId);
    if (!competitor) {
      throw new AppError(ErrorCode.NOT_FOUND, "Competitor not found", 404);
    }

    const statusUsecase = new GetSweepStatus(context);
    const run = await statusUsecase.execute(runId);

    if (run.competitorId !== competitorId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Run is for a different competitor", 400);
    }

    return c.json({ data: run, correlationId });
  });

  // List sweep run logs
  routes.get("/competitors/:competitorId/runs", async (c) => {
    const correlationId = (c.get("correlationId") as string) || randomUUID();
    const competitorId = c.req.param("competitorId") || "";
    const context = ctxResolver(c);

    // Validate tenant boundary
    const competitor = await context.repos.competitor.get(context.identity.tenantId, context.identity.workspaceId, competitorId);
    if (!competitor) {
      throw new AppError(ErrorCode.NOT_FOUND, "Competitor not found", 404);
    }

    const listUsecase = new ListRunLogs(context);
    const runs = await listUsecase.execute(competitorId);

    return c.json({ data: runs, correlationId });
  });

  return routes;
}
