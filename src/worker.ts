import { buildApp } from "./app";

// Cloudflare Workers entry. Same app; bindings (R2/D1) wired in production via factory overrides.
export default {
  async fetch(request: Request, _env: unknown): Promise<Response> {
    return buildApp().fetch(request);
  },
};
