import { handle } from "hono/vercel";
import { buildApp } from "../src/app";

// Ensure process.env has version and commit SHA at runtime if available
if (!process.env.VITE_GIT_COMMIT_SHA) {
  process.env.VITE_GIT_COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
}
if (!process.env.VITE_APP_VERSION) {
  process.env.VITE_APP_VERSION = "0.3.0";
}

const app = buildApp();

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
