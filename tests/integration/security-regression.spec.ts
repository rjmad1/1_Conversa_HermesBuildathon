import { describe, it, expect, vi, afterEach } from "vitest";
import { buildApp } from "../../src/app";
import { buildConfig } from "../../src/shared/config/env";
import { AppError, ErrorCode } from "../../src/shared/errors/AppError";
import { resetConfigForTests } from "../../src/shared/config";

describe("Security Containment & Prototype Remediation Regression", () => {
  afterEach(() => {
    resetConfigForTests();
    delete (process.env as any).NODE_ENV;
    delete (process.env as any).AUTH_MODE;
    delete (process.env as any).ALLOW_DEV_IDENTITY;
    delete (process.env as any).PUBLIC_DEMO_MODE;
    delete (process.env as any).ALLOWED_ORIGINS;
    delete (process.env as any).PROD_AUTH_TOKENS;
    delete (process.env as any).OPENAI_API_KEY;
    delete (process.env as any).TRANSCRIPTION_PROVIDER;
    delete (process.env as any).ANALYSIS_PROVIDER;
  });

  describe("Configuration & Startup Validation in Production", () => {
    it("throws if fake transcription provider is configured in production", () => {
      expect(() =>
        buildConfig({
          NODE_ENV: "production",
          TRANSCRIPTION_PROVIDER: "fake",
          OPENAI_API_KEY: "sk-test",
        })
      ).toThrow("Fake transcription provider is prohibited in production");
    });

    it("throws if fake analysis provider is configured in production", () => {
      expect(() =>
        buildConfig({
          NODE_ENV: "production",
          TRANSCRIPTION_PROVIDER: "openai",
          ANALYSIS_PROVIDER: "fake",
          OPENAI_API_KEY: "sk-test",
        })
      ).toThrow("Fake analysis provider is prohibited in production");
    });

    it("throws if OPENAI_API_KEY is missing in production", () => {
      expect(() =>
        buildConfig({
          NODE_ENV: "production",
          TRANSCRIPTION_PROVIDER: "openai",
          ANALYSIS_PROVIDER: "openai",
        })
      ).toThrow("OPENAI_API_KEY is required in production");
    });

    it("throws if ALLOW_DEV_IDENTITY is enabled in production", () => {
      expect(() =>
        buildConfig({
          NODE_ENV: "production",
          TRANSCRIPTION_PROVIDER: "openai",
          ANALYSIS_PROVIDER: "openai",
          OPENAI_API_KEY: "sk-test",
          ALLOW_DEV_IDENTITY: "true",
        })
      ).toThrow("Development identity is prohibited in production");
    });
  });

  describe("Identity Resolution & Authentication in Production", () => {
    const startAppInProd = () => {
      resetConfigForTests();
      (process.env as any).NODE_ENV = "production";
      (process.env as any).TRANSCRIPTION_PROVIDER = "openai";
      (process.env as any).ANALYSIS_PROVIDER = "openai";
      (process.env as any).OPENAI_API_KEY = "sk-test";
      (process.env as any).ALLOW_DEV_IDENTITY = "false";
      (process.env as any).PUBLIC_DEMO_MODE = "false";
      (process.env as any).PROD_AUTH_TOKENS = "admin:admin-token-xyz,approver:approver-token-xyz,viewer:viewer-token-xyz";
      return buildApp();
    };

    it("returns 401 when Authorization header is missing in production and public demo is disabled", async () => {
      const app = startAppInProd();
      const res = await app.request("/api/v1/meetings/some-id", {
        method: "GET",
      });
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it("returns 401 for invalid Bearer tokens in production", async () => {
      const app = startAppInProd();
      const res = await app.request("/api/v1/meetings/some-id", {
        method: "GET",
        headers: {
          Authorization: "Bearer bad-token",
        },
      });
      expect(res.status).toBe(401);
    });

    it("allows public read-only access (GET) when PUBLIC_DEMO_MODE=true", async () => {
      resetConfigForTests();
      (process.env as any).NODE_ENV = "production";
      (process.env as any).TRANSCRIPTION_PROVIDER = "openai";
      (process.env as any).ANALYSIS_PROVIDER = "openai";
      (process.env as any).OPENAI_API_KEY = "sk-test";
      (process.env as any).ALLOW_DEV_IDENTITY = "false";
      (process.env as any).PUBLIC_DEMO_MODE = "true"; // public demo enabled
      const app = buildApp();

      // GET meeting (non-existent, should fall through to 404 meeting not found, not 401 unauth)
      const res = await app.request("/api/v1/meetings/00000000-0000-0000-0000-000000000000", {
        method: "GET",
      });
      expect(res.status).toBe(404);
    });

    it("resolves roles correctly based on verified token map", async () => {
      const app = startAppInProd();

      // Admin Token can trigger reset (returns 200)
      const resReset = await app.request("/api/v1/workspace/reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer admin-token-xyz",
        },
      });
      expect(resReset.status).toBe(200);

      // Approver Token is rejected from reset (returns 403)
      const resResetAppr = await app.request("/api/v1/workspace/reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer approver-token-xyz",
        },
      });
      expect(resResetAppr.status).toBe(403);
    });

    it("ignores development headers in production", async () => {
      const app = startAppInProd();
      // Even if attacker passes dev headers, they must not bypass auth
      const res = await app.request("/api/v1/meetings/some-id", {
        method: "GET",
        headers: {
          "x-tenant-id": "attacker-tenant",
          "x-workspace-id": "attacker-workspace",
          "x-actor-id": "attacker-admin",
        },
      });
      expect(res.status).toBe(401);
    });
  });

  describe("Centralized Authorization Guard & Roles", () => {
    const startAppInDevWithFlags = () => {
      resetConfigForTests();
      (process.env as any).NODE_ENV = "development";
      (process.env as any).ALLOW_DEV_IDENTITY = "true";
      return buildApp();
    };

    it("allows Approver role to perform mutations", async () => {
      const app = startAppInDevWithFlags();
      const res = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: {
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user", // maps to approver
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Approver Meeting",
          meetingType: "CEREMONY",
          scheduledAt: new Date().toISOString(),
        }),
      });
      expect(res.status).toBe(201);
    });

    it("rejects Viewer role from performing mutations", async () => {
      const app = startAppInDevWithFlags();
      const res = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: {
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "guest-viewer", // maps to viewer
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Viewer Meeting",
          meetingType: "CEREMONY",
          scheduledAt: new Date().toISOString(),
        }),
      });
      expect(res.status).toBe(403);
    });

    it("rejects Approver role from performing reset", async () => {
      const app = startAppInDevWithFlags();
      const res = await app.request("/api/v1/workspace/reset", {
        method: "POST",
        headers: {
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user", // maps to approver
        },
      });
      expect(res.status).toBe(403);
    });

    it("allows Admin role to perform reset", async () => {
      const app = startAppInDevWithFlags();
      const res = await app.request("/api/v1/workspace/reset", {
        method: "POST",
        headers: {
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "owner-user", // maps to admin
        },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("CORS Restrictions", () => {
    it("rejects unexpected origins in production CORS requests", async () => {
      resetConfigForTests();
      (process.env as any).NODE_ENV = "production";
      (process.env as any).TRANSCRIPTION_PROVIDER = "openai";
      (process.env as any).ANALYSIS_PROVIDER = "openai";
      (process.env as any).OPENAI_API_KEY = "sk-test";
      (process.env as any).ALLOW_DEV_IDENTITY = "false";
      (process.env as any).ALLOWED_ORIGINS = "https://trusted-site.com";
      const app = buildApp();

      const res = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: {
          Origin: "https://attacker-site.com",
        },
      });
      expect(res.status).toBe(403);
    });

    it("allows trusted origins in production CORS requests", async () => {
      resetConfigForTests();
      (process.env as any).NODE_ENV = "production";
      (process.env as any).TRANSCRIPTION_PROVIDER = "openai";
      (process.env as any).ANALYSIS_PROVIDER = "openai";
      (process.env as any).OPENAI_API_KEY = "sk-test";
      (process.env as any).ALLOW_DEV_IDENTITY = "false";
      (process.env as any).PUBLIC_DEMO_MODE = "true";
      (process.env as any).ALLOWED_ORIGINS = "https://trusted-site.com";
      const app = buildApp();

      const res = await app.request("/api/v1/meetings/00000000-0000-0000-0000-000000000000", {
        method: "GET",
        headers: {
          Origin: "https://trusted-site.com",
        },
      });
      // Should bypass origin check and proceed (non-existent UUID yields 404, not 403)
      expect(res.status).toBe(404);
      expect(res.headers.get("access-control-allow-origin")).toBe("https://trusted-site.com");
    });
  });

  describe("Body size and type limits", () => {
    it("rejects oversized request content lengths with 413 before parsing", async () => {
      resetConfigForTests();
      process.env.ALLOW_DEV_IDENTITY = "true"; // Allow dev headers so authGuard passes
      const app = buildApp();
      const res = await app.request("/api/v1/meetings/some-id/audio", {
        method: "POST",
        headers: {
          "x-tenant-id": "demo",
          "x-workspace-id": "demo",
          "x-actor-id": "dev-user",
          "content-length": "999999999", // Way above default limit
        },
      });
      expect(res.status).toBe(413);
    });
  });

  describe("Workspace reset isolation checks", () => {
    it("reset operation clears caller workspace only", async () => {
      resetConfigForTests();
      process.env.ALLOW_DEV_IDENTITY = "true"; // Allow dev headers so dev role mapping works
      const app = buildApp();
      
      const H_A = { "x-tenant-id": "tenantA", "x-workspace-id": "wsA", "x-actor-id": "owner-user", "content-type": "application/json" };
      const H_B = { "x-tenant-id": "tenantB", "x-workspace-id": "wsB", "x-actor-id": "owner-user", "content-type": "application/json" };

      // 1. Create meeting in Workspace A
      const resA = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: H_A,
        body: JSON.stringify({ title: "Meeting A", meetingType: "DECISION", scheduledAt: new Date().toISOString() })
      });
      const meetingA = (await resA.json() as any).data;

      // 2. Create meeting in Workspace B
      const resB = await app.request("/api/v1/meetings", {
        method: "POST",
        headers: H_B,
        body: JSON.stringify({ title: "Meeting B", meetingType: "DECISION", scheduledAt: new Date().toISOString() })
      });
      const meetingB = (await resB.json() as any).data;

      // 3. Reset Workspace A
      const resReset = await app.request("/api/v1/workspace/reset", {
        method: "POST",
        headers: H_A,
      });
      expect(resReset.status).toBe(200);

      // 4. Verify Meeting A is deleted (404)
      const resGetA = await app.request(`/api/v1/meetings/${meetingA.id}`, { method: "GET", headers: H_A });
      expect(resGetA.status).toBe(404);

      // 5. Verify Meeting B is NOT deleted (succeeds)
      const resGetB = await app.request(`/api/v1/meetings/${meetingB.id}`, { method: "GET", headers: H_B });
      expect(resGetB.status).toBe(200);
    });
  });
});
