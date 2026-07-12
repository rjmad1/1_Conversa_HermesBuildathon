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
 * AUTH_MODE !== 'prod' and NODE_ENV !== 'production'.
 *
 * WARNING: Caller-controlled tenant/workspace headers ('x-tenant-id', 'x-workspace-id')
 * are development-only conveniences and MUST NOT be used as authentication credentials in production.
 * In production this adapter fails closed at boot time, and must be replaced by a secure verified token resolver.
 */
export class DevIdentityAdapter implements IdentityAdapter {
  constructor(private readonly mode: "dev" | "prod" = "dev") {
    if (this.mode === "prod" || (typeof process !== "undefined" && process.env?.NODE_ENV === "production")) {
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
    return {
      tenantId: headers["x-tenant-id"] || DEMO_TENANT,
      workspaceId: headers["x-workspace-id"] || DEMO_WORKSPACE,
      actorId: headers["x-actor-id"] || "dev-user",
      actorType: "user",
    };
  }
}
