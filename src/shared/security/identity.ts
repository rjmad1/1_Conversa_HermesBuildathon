export interface Identity {
  tenantId: string;
  workspaceId: string;
  actorId: string;
  actorType: "user" | "system" | "agent";
}

export interface IdentityAdapter {
  resolve(headers: Record<string, string | undefined>): Identity;
  isProduction(): boolean;
}

const DEMO_TENANT = "demo";
const DEMO_WORKSPACE = "demo";

/**
 * Development identity adapter. Isolated behind IdentityAdapter; only active when
 * AUTH_MODE !== 'prod'. In production this MUST be replaced by an authenticated resolver.
 * Tenant/workspace may be overridden via headers (extension path documented in ADR 0003 §6),
 * but default to the fixed demo tenant so the single-tenant MVP works without auth.
 */
export class DevIdentityAdapter implements IdentityAdapter {
  constructor(private readonly mode: "dev" | "prod" = "dev") {}

  isProduction(): boolean {
    return this.mode === "prod";
  }

  resolve(headers: Record<string, string | undefined>): Identity {
    if (this.mode === "prod") {
      throw new Error("DevIdentityAdapter cannot resolve identity in production; use an authenticated adapter.");
    }
    return {
      tenantId: headers["x-tenant-id"] || DEMO_TENANT,
      workspaceId: headers["x-workspace-id"] || DEMO_WORKSPACE,
      actorId: headers["x-actor-id"] || "dev-user",
      actorType: "user",
    };
  }
}
