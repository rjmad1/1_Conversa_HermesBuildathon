import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClerkIdentityAdapter } from "../../src/shared/security/identity";
import { AppError } from "../../src/shared/errors/AppError";
import { buildApp } from "../../src/app";

describe("Clerk Authentication Middleware", () => {
  describe("ClerkIdentityAdapter", () => {
    it("successfully decodes valid claims from a base64url encoded JWT", () => {
      const adapter = new ClerkIdentityAdapter({} as any);

      // Create a mock JWT payload: { sub: "user-clerk-1", org_id: "tenant-clerk", org_role: "org:admin" }
      const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(
        JSON.stringify({
          sub: "user-clerk-1",
          org_id: "tenant-clerk",
          workspaceId: "workspace-clerk",
          org_role: "org:admin",
        })
      ).toString("base64url");
      const signature = "dummy-sig";
      const token = `${header}.${payload}.${signature}`;

      const identity = adapter.resolve({ authorization: `Bearer ${token}` });

      expect(identity.actorId).toBe("user-clerk-1");
      expect(identity.tenantId).toBe("tenant-clerk");
      expect(identity.workspaceId).toBe("workspace-clerk");
      expect(identity.role).toBe("admin");
    });

    it("throws 401 when authorization header is missing", () => {
      const adapter = new ClerkIdentityAdapter({} as any);
      expect(() => adapter.resolve({})).toThrow(
        expect.objectContaining({ httpStatus: 401, message: "Authorization required" })
      );
    });

    it("throws 401 when authorization header is malformed", () => {
      const adapter = new ClerkIdentityAdapter({} as any);
      expect(() => adapter.resolve({ authorization: "BadTokenValue" })).toThrow(
        expect.objectContaining({ httpStatus: 401, message: "Invalid authorization header format. Use Bearer <token>" })
      );
    });
  });

  describe("End-to-End Routing Integration", () => {
    it("guards Hono routes using ClerkIdentityAdapter when CLERK_JWKS_URL is configured", async () => {
      // Force app construction with CLERK_JWKS_URL configuration and dev identity disabled
      process.env.CLERK_JWKS_URL = "https://clerk.example.com/v1/jwks";
      process.env.ALLOW_DEV_IDENTITY = "false";
      process.env.AUTH_MODE = "prod";
      process.env.TRANSCRIPTION_PROVIDER = "openai";
      process.env.ANALYSIS_PROVIDER = "openai";
      process.env.OPENAI_API_KEY = "sk-dummy";

      const app = buildApp();

      // Make a call without bearer token
      const res = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      expect(res.status).toBe(401);

      delete process.env.CLERK_JWKS_URL;
      delete process.env.ALLOW_DEV_IDENTITY;
      delete process.env.AUTH_MODE;
      delete process.env.TRANSCRIPTION_PROVIDER;
      delete process.env.ANALYSIS_PROVIDER;
      delete process.env.OPENAI_API_KEY;
    });
  });
});
