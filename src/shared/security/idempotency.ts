import type { Context } from "hono";
import { AppError, ErrorCode } from "../errors/AppError";
import { logger } from "../logging/logger";

interface IdempotencyRecord {
  status: "RUNNING" | "COMPLETED";
  statusCode: number;
  responseBody: string;
}

export class IdempotencyStore {
  private static store = new Map<string, IdempotencyRecord>();

  static get(tenantId: string, workspaceId: string, key: string): IdempotencyRecord | undefined {
    return this.store.get(`${tenantId}:${workspaceId}:${key}`);
  }

  static set(tenantId: string, workspaceId: string, key: string, record: IdempotencyRecord): void {
    this.store.set(`${tenantId}:${workspaceId}:${key}`, record);
  }

  static delete(tenantId: string, workspaceId: string, key: string): void {
    this.store.delete(`${tenantId}:${workspaceId}:${key}`);
  }
}

export const idempotencyMiddleware = async (c: Context, next: () => Promise<void>) => {
  const key = c.req.header("x-idempotency-key");
  const method = c.req.method.toUpperCase();

  // Only apply to mutating requests
  if (!key || (method !== "POST" && method !== "PUT" && method !== "DELETE")) {
    await next();
    return;
  }

  const tenantId = c.req.header("x-tenant-id") || "demo";
  const workspaceId = c.req.header("x-workspace-id") || "demo";

  const existing = IdempotencyStore.get(tenantId, workspaceId, key);

  if (existing) {
    if (existing.status === "RUNNING") {
      logger.warn({ key, tenantId, workspaceId }, "Concurrent request detected for idempotency key");
      throw new AppError(ErrorCode.VALIDATION_ERROR, "A request with this idempotency key is already in progress", 409);
    }
    if (existing.status === "COMPLETED") {
      logger.info({ key, tenantId, workspaceId }, "Returning cached response from idempotency key");
      c.status(existing.statusCode as any);
      return c.json(JSON.parse(existing.responseBody));
    }
  }

  // Lock the key
  IdempotencyStore.set(tenantId, workspaceId, key, {
    status: "RUNNING",
    statusCode: 200,
    responseBody: "",
  });

  // Intercept json rendering before calling next()
  const originalJson = c.json.bind(c);
  (c as any).json = function (body: any, status?: any, ...args: any[]) {
    const code = status || c.res.status || 200;
    IdempotencyStore.set(tenantId, workspaceId, key, {
      status: "COMPLETED",
      statusCode: code,
      responseBody: JSON.stringify(body),
    });
    return originalJson(body, status, ...args);
  };

  try {
    await next();
    // If the request completes without calling c.json (e.g. text/html/empty response), 
    // we should still mark it as completed or handle it. But for Hono JSON APIs, c.json is standard.
    const current = IdempotencyStore.get(tenantId, workspaceId, key);
    if (current && current.status === "RUNNING") {
      IdempotencyStore.set(tenantId, workspaceId, key, {
        status: "COMPLETED",
        statusCode: c.res.status || 200,
        responseBody: "{}",
      });
    }
  } catch (err) {
    // Release lock on failure so the user can retry
    IdempotencyStore.delete(tenantId, workspaceId, key);
    throw err;
  }
};
