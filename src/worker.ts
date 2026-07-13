import { buildApp } from "./app";

// Cloudflare Workers entry. Same app; bindings (R2/D1) wired in production via factory overrides.
let cachedApp: ReturnType<typeof buildApp> | null = null;

function getApp() {
  if (!cachedApp) {
    cachedApp = buildApp();
  }
  return cachedApp;
}

export default {
  async fetch(request: Request, _env: unknown): Promise<Response> {
    return getApp().fetch(request);
  },
  async scheduled(event: unknown, env: unknown, ctx: unknown): Promise<void> {
    const response = await getApp().request("/api/v1/scheduler/sweep", {
      method: "POST",
      headers: {
        "x-tenant-id": "demo",
        "x-workspace-id": "demo",
        "x-actor-id": "scheduler-admin",
      },
    });
    if (!response.ok) {
      console.error("Scheduled sweep failed: " + response.statusText);
    }
  },
};
