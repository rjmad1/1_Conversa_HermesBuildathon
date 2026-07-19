import { handle } from "hono/vercel";
import { buildApp } from "@/src/app";

let appInstance: ReturnType<typeof buildApp> | null = null;

function getApp() {
  if (!appInstance) {
    appInstance = buildApp();
  }
  return appInstance;
}

export const GET = (req: Request) => handle(getApp())(req);
export const POST = (req: Request) => handle(getApp())(req);
export const PUT = (req: Request) => handle(getApp())(req);
export const DELETE = (req: Request) => handle(getApp())(req);
export const PATCH = (req: Request) => handle(getApp())(req);
