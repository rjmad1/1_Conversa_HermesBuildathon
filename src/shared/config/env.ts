import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_MODE: z.enum(["dev", "prod"]).default("dev"),
  DEMO_TENANT_ID: z.string().default("demo"),
  DEMO_WORKSPACE_ID: z.string().default("demo"),
  AUDIO_MAX_BYTES: z.coerce.number().int().positive().default(10485760),
  AUDIO_MAX_SECONDS: z.coerce.number().int().positive().default(7200),
  AUDIO_ALLOWED_MIME_TYPES: z.string().default("audio/mpeg,audio/wav,audio/mp4"),
  TRANSCRIPTION_PROVIDER: z.enum(["openai", "fake"]).default("fake"),
  ANALYSIS_PROVIDER: z.enum(["openai", "fake"]).default("fake"),
  OPENAI_API_KEY: z.string().optional(),
  TRANSCRIPTION_MODEL: z.string().default("whisper-1"),
  ANALYSIS_MODEL: z.string().default("gpt-4o-mini"),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(55000),
  PROVIDER_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
  STORAGE_BACKEND: z.enum(["memory", "r2"]).default("memory"),
  PERSISTENCE_BACKEND: z.enum(["memory", "d1"]).default("memory"),
  MEDIA_VIDEO_ENABLED: z.enum(["true", "false"]).default("false"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function buildConfig(overrides: Record<string, string | undefined> = {}): AppEnv {
  const merged = { ...process.env, ...stripUndefined(overrides) };
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration: " + JSON.stringify(parsed.error.issues));
  }
  return parsed.data;
}

function stripUndefined(obj: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

export function allowedMimeTypes(cfg: AppEnv): string[] {
  return cfg.AUDIO_ALLOWED_MIME_TYPES.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isVideoEnabled(cfg: AppEnv): boolean {
  return cfg.MEDIA_VIDEO_ENABLED === "true";
}
