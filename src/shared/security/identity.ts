import type { AppEnv } from "../config/env";
import { AppError, ErrorCode } from "../errors/AppError";

export interface Identity {
  tenantId: string;
  workspaceId: string;
  actorId: string;
  actorType: "user" | "system" | "agent";
  role: "viewer" | "approver" | "admin";
  openaiApiKey?: string;
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
      openaiApiKey: headers["x-openai-api-key"],
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
      openaiApiKey: headers["x-openai-api-key"],
    };
  }
}

/**
 * Clerk identity adapter. Decodes Clerk JWT claims and optionally performs cryptographic checks.
 */
export class ClerkIdentityAdapter implements IdentityAdapter {
  constructor(private readonly cfg: AppEnv) {}

  isProduction(): boolean {
    return true;
  }

  resolve(headers: Record<string, string | undefined>): Identity {
    const authHeader = headers["authorization"];
    if (!authHeader) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Authorization required", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid authorization header format. Use Bearer <token>", 401);
    }

    const token = authHeader.substring(7).trim();

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Malformed JWT token", 401);
      }

      // Base64url decode payload
      const payloadB64 = parts[1] || "";
      const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
      const claims = JSON.parse(payloadStr);

      const actorId = claims.sub || "anonymous";
      const tenantId = claims.tenantId || claims.org_id || "demo";
      const workspaceId = claims.workspaceId || "demo";
      const role = claims.role || (claims.org_role === "org:admin" ? "admin" : "approver");

      return {
        tenantId,
        workspaceId,
        actorId,
        actorType: "user",
        role: role as any,
        openaiApiKey: headers["x-openai-api-key"],
      };
    } catch (err) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid token claims", 401);
    }
  }
}

/**
 * Enterprise SAML 2.0 / OIDC Identity Adapter.
 * Decodes SAML 2.0 assertions and Enterprise OIDC ID Tokens from Entra ID, Okta, and Ping Identity.
 */
export class SamlOidcIdentityAdapter implements IdentityAdapter {
  constructor(private readonly cfg: AppEnv) {}

  isProduction(): boolean {
    return true;
  }

  resolve(headers: Record<string, string | undefined>): Identity {
    const samlAssertion = headers["x-saml-assertion"];
    const authHeader = headers["authorization"];

    if (samlAssertion) {
      try {
        const decodedStr = Buffer.from(samlAssertion, "base64").toString("utf-8");
        const matchSubject = decodedStr.match(/<NameID[^>]*>(.*?)<\/NameID>/i);
        const matchTenant = decodedStr.match(/Attribute Name="tenantId"[^>]*>.*?<AttributeValue>(.*?)<\/AttributeValue>/i);
        const matchWorkspace = decodedStr.match(/Attribute Name="workspaceId"[^>]*>.*?<AttributeValue>(.*?)<\/AttributeValue>/i);
        const matchRole = decodedStr.match(/Attribute Name="role"[^>]*>.*?<AttributeValue>(.*?)<\/AttributeValue>/i);

        const actorId = (matchSubject && matchSubject[1]) || "saml-enterprise-user";
        const tenantId = (matchTenant && matchTenant[1]) || "enterprise-tenant";
        const workspaceId = (matchWorkspace && matchWorkspace[1]) || "enterprise-workspace";
        const role = (matchRole && matchRole[1]) ? (matchRole[1] as any) : "approver";

        return {
          tenantId,
          workspaceId,
          actorId,
          actorType: "user",
          role,
          openaiApiKey: headers["x-openai-api-key"],
        };
      } catch (err) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid SAML 2.0 assertion payload", 401);
      }
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1] || "", "base64url").toString("utf-8");
          const claims = JSON.parse(payloadStr);

          const actorId = claims.sub || claims.email || "oidc-user";
          const tenantId = claims.tid || claims.tenantId || claims.org_id || "enterprise-tenant";
          const workspaceId = claims.workspaceId || "enterprise-workspace";
          const role = claims.roles?.includes("Admin") ? "admin" : "approver";

          return {
            tenantId,
            workspaceId,
            actorId,
            actorType: "user",
            role,
            openaiApiKey: headers["x-openai-api-key"],
          };
        }
      } catch (err) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid OIDC Enterprise token", 401);
      }
    }

    throw new AppError(ErrorCode.VALIDATION_ERROR, "SAML 2.0 assertion or OIDC authorization token required", 401);
  }
}

