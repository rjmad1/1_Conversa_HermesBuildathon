import { buildConfig, type AppEnv } from "./env";

let cached: AppEnv | null = null;

export function getConfig(): AppEnv {
  if (!cached) cached = buildConfig();
  return cached;
}

export function resetConfigForTests(): void {
  cached = null;
}

export type { AppEnv };
export { allowedMimeTypes, isVideoEnabled } from "./env";
