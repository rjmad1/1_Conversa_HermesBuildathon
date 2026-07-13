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
  PERSISTENCE_BACKEND: z.enum(["memory", "d1", "convex"]).default("memory"),
  MEDIA_VIDEO_ENABLED: z.enum(["true", "false"]).default("false"),
  ALLOW_DEV_IDENTITY: z.enum(["true", "false"]).default("false"),
  PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("true"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000"),
  PROD_AUTH_TOKENS: z.string().optional(),
  CONVEX_URL: z.string().optional(),
  CONVEX_DEPLOY_KEY: z.string().optional(),
  CLERK_JWKS_URL: z.string().optional(),
  LINKUP_API_KEY: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  JIRA_API_URL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  SALESFORCE_API_URL: z.string().optional(),
  SALESFORCE_API_TOKEN: z.string().optional(),
  GITHUB_API_TOKEN: z.string().optional(),
  LINEAR_API_KEY: z.string().optional(),
  HUBSPOT_API_KEY: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
  OUTLOOK_CLIENT_ID: z.string().optional(),
  CLAUDE_CODE_ENDPOINT: z.string().optional(),
  CURSOR_ENDPOINT: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  CODEX_API_KEY: z.string().optional(),
  LOVABLE_API_KEY: z.string().optional(),
  MCP_SERVER_URL: z.string().optional(),
  DIRECT_API_WEBHOOK_URL: z.string().optional(),
  RATE_LIMIT_TRANSCRIPTION_LIMIT: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_ANALYSIS_LIMIT: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_AGENCY_LIMIT: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_ADMIN_LIMIT: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

export type AppEnv = z.infer<typeof envSchema>;

export function buildConfig(overrides: Record<string, string | undefined> = {}): AppEnv {
  const merged = { ...process.env, ...stripUndefined(overrides) };
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration: " + JSON.stringify(parsed.error.issues));
  }
  const data = parsed.data;
  if (data.NODE_ENV === "production" || data.AUTH_MODE === "prod") {
    if (data.TRANSCRIPTION_PROVIDER === "fake") {
      throw new Error("CRITICAL CONFIGURATION ERROR: Fake transcription provider is prohibited in production.");
    }
    if (data.ANALYSIS_PROVIDER === "fake") {
      throw new Error("CRITICAL CONFIGURATION ERROR: Fake analysis provider is prohibited in production.");
    }
    if (!data.OPENAI_API_KEY) {
      throw new Error("CRITICAL CONFIGURATION ERROR: OPENAI_API_KEY is required in production.");
    }
    if (data.ALLOW_DEV_IDENTITY === "true") {
      throw new Error("CRITICAL CONFIGURATION ERROR: Development identity is prohibited in production.");
    }
  }
  return data;
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
