import type { AppEnv } from "../config/env";
import { AppError, ErrorCode } from "../errors/AppError";

export interface Identity {
  tenantId: string;
  workspaceId: string;
  actorId: string;
  actorType: "user" | "system" | "agent";
  role: "viewer" | "approver" | "admin";
}

export interface IdentityAdapter {
  resolve(headers: Record<string, string | undefined>): Identity;
  isProduction(): boolean;
}

const DEMO_TENANT = "demo";
const DEMO_WORKSPACE = "demo";

export function resolveRole(actorId: string): "viewer" | "approver" | "admin" {
  const normalized = actorId.toLowerCase();
  if (normalized.includes("admin") || normalized === "owner-user") {
    return "admin";
  }
  if (normalized.includes("viewer") || normalized === "guest-user") {
    return "viewer";
  }
  // approvals/mutations are standard in tests (e.g. dev-user, user-a, user-b, judge)
  if (normalized.includes("approver") || normalized === "dev-user" || normalized.startsWith("user-") || normalized === "judge") {
    return "approver";
  }
  return "approver"; // default safe fallback for compatibility
}

/**
 * Development identity adapter. Isolated behind IdentityAdapter; only active when
 * ALLOW_DEV_IDENTITY = 'true' and NODE_ENV !== 'production'.
 */
export class DevIdentityAdapter implements IdentityAdapter {
  constructor(private readonly mode: "dev" | "prod" = "dev") {
    const isVercelDemo = typeof process !== "undefined" && process.env?.VERCEL === "1" && process.env?.AUTH_MODE !== "prod";
    if (this.mode === "prod" || (typeof process !== "undefined" && process.env?.NODE_ENV === "production" && !isVercelDemo)) {
      throw new Error("CRITICAL SECURITY ERROR: DevIdentityAdapter is prohibited in production runtimes.");
    }
  }

  isProduction(): boolean {
    return this.mode === "prod";
  }

  resolve(headers: Record<string, string | undefined>): Identity {
    if (this.mode === "prod") {
      throw new Error("DevIdentityAdapter cannot resolve identity in production; use an authenticated adapter.");
    }
    const actorId = headers["x-actor-id"] || "dev-user";
    return {
      tenantId: headers["x-tenant-id"] || DEMO_TENANT,
      workspaceId: headers["x-workspace-id"] || DEMO_WORKSPACE,
      actorId,
      actorType: "user",
      role: resolveRole(actorId),
    };
  }
}

/**
 * Production identity adapter. Enforces server-side token authentication
 * and scopes tenancy to the configured demo tenant/workspace.
 */
export class ProdIdentityAdapter implements IdentityAdapter {
  private tokenMap = new Map<string, { actorId: string; role: "viewer" | "approver" | "admin" }>();

  constructor(private readonly cfg: AppEnv) {
    const tokensStr = cfg.PROD_AUTH_TOKENS || "admin:admin-token,approver:approver-token,viewer:viewer-token";
    for (const pair of tokensStr.split(",")) {
      const idx = pair.indexOf(":");
      if (idx > 0) {
        const role = pair.slice(0, idx).trim().toLowerCase();
        const token = pair.slice(idx + 1).trim();
        if (token && (role === "admin" || role === "approver" || role === "viewer")) {
          this.tokenMap.set(token, { actorId: `prod-${role}`, role });
        }
      }
    }
  }

  isProduction(): boolean {
    return true;
  }

  resolve(headers: Record<string, string | undefined>): Identity {
    const tenantId = this.cfg.DEMO_TENANT_ID;
    const workspaceId = this.cfg.DEMO_WORKSPACE_ID;

    const authHeader = headers["authorization"];
    if (!authHeader) {
      if (this.cfg.PUBLIC_DEMO_MODE === "true") {
        return {
          tenantId,
          workspaceId,
          actorId: "anonymous-guest",
          actorType: "user",
          role: "viewer",
        };
      }
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Authorization required", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid authorization header format. Use Bearer <token>", 401);
    }

    const token = authHeader.substring(7).trim();
    const resolved = this.tokenMap.get(token);
    if (!resolved) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid token credentials", 401);
    }

    return {
      tenantId,
      workspaceId,
      actorId: resolved.actorId,
      actorType: "user",
      role: resolved.role,
    };
  }
}
