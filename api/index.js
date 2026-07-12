// api/server.ts
import { handle } from "hono/vercel";

// src/app/index.ts
import { Hono } from "hono";
import { randomUUID as randomUUID9 } from "node:crypto";

// src/shared/config/env.ts
import { z } from "zod";
var envSchema = z.object({
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
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(55e3),
  PROVIDER_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
  STORAGE_BACKEND: z.enum(["memory", "r2"]).default("memory"),
  PERSISTENCE_BACKEND: z.enum(["memory", "d1"]).default("memory"),
  MEDIA_VIDEO_ENABLED: z.enum(["true", "false"]).default("false")
});
function buildConfig(overrides = {}) {
  const merged = { ...process.env, ...stripUndefined(overrides) };
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration: " + JSON.stringify(parsed.error.issues));
  }
  return parsed.data;
}
function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== void 0) out[k] = v;
  return out;
}
function allowedMimeTypes(cfg) {
  return cfg.AUDIO_ALLOWED_MIME_TYPES.split(",").map((s) => s.trim()).filter(Boolean);
}
function isVideoEnabled(cfg) {
  return cfg.MEDIA_VIDEO_ENABLED === "true";
}

// src/shared/config/index.ts
var cached = null;
function getConfig() {
  if (!cached) cached = buildConfig();
  return cached;
}

// src/shared/security/identity.ts
var DEMO_TENANT = "demo";
var DEMO_WORKSPACE = "demo";
var DevIdentityAdapter = class {
  constructor(mode = "dev") {
    this.mode = mode;
    const isVercelDemo = typeof process !== "undefined" && process.env?.VERCEL === "1" && process.env?.AUTH_MODE !== "prod";
    if (this.mode === "prod" || typeof process !== "undefined" && process.env?.NODE_ENV === "production" && !isVercelDemo) {
      throw new Error("CRITICAL SECURITY ERROR: DevIdentityAdapter is prohibited in production runtimes.");
    }
  }
  isProduction() {
    return this.mode === "prod";
  }
  resolve(headers) {
    if (this.mode === "prod") {
      throw new Error("DevIdentityAdapter cannot resolve identity in production; use an authenticated adapter.");
    }
    return {
      tenantId: headers["x-tenant-id"] || DEMO_TENANT,
      workspaceId: headers["x-workspace-id"] || DEMO_WORKSPACE,
      actorId: headers["x-actor-id"] || "dev-user",
      actorType: "user"
    };
  }
};

// src/shared/errors/AppError.ts
var AppError = class extends Error {
  code;
  httpStatus;
  details;
  retryable;
  constructor(code, message, httpStatus, details, retryable = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.retryable = retryable;
  }
};

// src/infrastructure/repositories/in-memory.ts
function scopeMatch(a, tenantId, workspaceId) {
  if (!a.tenantId || !a.workspaceId || !tenantId || !workspaceId) return false;
  return a.tenantId === tenantId && a.workspaceId === workspaceId;
}
var InMemoryMeetingRepo = class {
  meetings = /* @__PURE__ */ new Map();
  async save(m) {
    this.meetings.set(m.id, m);
  }
  async get(tenantId, workspaceId, id) {
    const m = this.meetings.get(id);
    return m && scopeMatch(m, tenantId, workspaceId) ? m : null;
  }
  async listByScope(tenantId, workspaceId) {
    return [...this.meetings.values()].filter((m) => scopeMatch(m, tenantId, workspaceId));
  }
};
var InMemoryAudioAssetRepo = class {
  assets = /* @__PURE__ */ new Map();
  async save(a) {
    this.assets.set(a.id, a);
  }
  async get(tenantId, workspaceId, id) {
    const a = this.assets.get(id);
    return a && scopeMatch(a, tenantId, workspaceId) ? a : null;
  }
  async findByChecksum(tenantId, workspaceId, meetingId, checksum) {
    return [...this.assets.values()].find(
      (a) => a.checksum === checksum && a.meetingId === meetingId && scopeMatch(a, tenantId, workspaceId)
    ) ?? null;
  }
  async findByMeeting(tenantId, workspaceId, meetingId) {
    return [...this.assets.values()].filter((a) => a.meetingId === meetingId && scopeMatch(a, tenantId, workspaceId));
  }
};
var InMemoryTranscriptRepo = class {
  items = /* @__PURE__ */ new Map();
  async save(t) {
    this.items.set(t.id, t);
  }
  async get(tenantId, workspaceId, id) {
    const t = this.items.get(id);
    return t && scopeMatch(t, tenantId, workspaceId) ? t : null;
  }
  async findByMeeting(tenantId, workspaceId, meetingId) {
    return [...this.items.values()].filter((t) => t.meetingId === meetingId && scopeMatch(t, tenantId, workspaceId));
  }
};
var InMemoryAnalysisRunRepo = class {
  runs = /* @__PURE__ */ new Map();
  async save(r) {
    this.runs.set(r.id, r);
  }
  async get(tenantId, workspaceId, id) {
    const r = this.runs.get(id);
    return r && scopeMatch(r, tenantId, workspaceId) ? r : null;
  }
  async findByMeeting(tenantId, workspaceId, meetingId) {
    return [...this.runs.values()].filter((r) => r.meetingId === meetingId && scopeMatch(r, tenantId, workspaceId));
  }
  async findByIdempotencyKey(tenantId, workspaceId, key) {
    const r = [...this.runs.values()].find((r2) => r2.idempotencyKey === key) ?? null;
    return r && scopeMatch(r, tenantId, workspaceId) ? r : null;
  }
};
var InMemoryMeetingAnalysisRepo = class {
  constructor(meetingRepoLookup, analysisRunRepoLookup) {
    this.meetingRepoLookup = meetingRepoLookup;
    this.analysisRunRepoLookup = analysisRunRepoLookup;
  }
  analyses = /* @__PURE__ */ new Map();
  decisions = /* @__PURE__ */ new Map();
  actions = /* @__PURE__ */ new Map();
  approvals = /* @__PURE__ */ new Map();
  getMeetingRepo() {
    if (!this.meetingRepoLookup) {
      throw new Error("MeetingRepo lookup not configured in InMemoryMeetingAnalysisRepo");
    }
    return this.meetingRepoLookup();
  }
  getAnalysisRunRepo() {
    if (!this.analysisRunRepoLookup) {
      throw new Error("AnalysisRunRepo lookup not configured in InMemoryMeetingAnalysisRepo");
    }
    return this.analysisRunRepoLookup();
  }
  async save(tenantId, workspaceId, a) {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Meeting not found", 404);
    this.analyses.set(a.id, a);
  }
  async getByMeeting(tenantId, workspaceId, meetingId) {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, meetingId);
    if (!m) return null;
    return [...this.analyses.values()].find((a) => a.meetingId === meetingId) ?? null;
  }
  async getByRun(tenantId, workspaceId, runId) {
    const r = await this.getAnalysisRunRepo().get(tenantId, workspaceId, runId);
    if (!r) return null;
    return [...this.analyses.values()].find((a) => a.meetingId === r.meetingId) ?? null;
  }
  async saveDecision(tenantId, workspaceId, d) {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, d.meetingId);
    if (!m) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Meeting not found", 404);
    this.decisions.set(d.id, d);
  }
  async saveAction(tenantId, workspaceId, a) {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Meeting not found", 404);
    this.actions.set(a.id, a);
  }
  async getAction(tenantId, workspaceId, id) {
    const a = this.actions.get(id);
    if (!a) return null;
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, a.meetingId);
    if (!m) return null;
    return a;
  }
  async updateAction(tenantId, workspaceId, a) {
    const existing = await this.getAction(tenantId, workspaceId, a.id);
    if (!existing) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Action not found", 404);
    this.actions.set(a.id, a);
  }
  async saveApproval(tenantId, workspaceId, p) {
    const action = await this.getAction(tenantId, workspaceId, p.actionId);
    if (!action) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Action not found", 404);
    this.approvals.set(p.id, p);
  }
  async listActionsByMeeting(tenantId, workspaceId, meetingId) {
    const m = await this.getMeetingRepo().get(tenantId, workspaceId, meetingId);
    if (!m) return [];
    return [...this.actions.values()].filter((a) => a.meetingId === meetingId);
  }
};
var InMemoryAuditRepo = class {
  events = [];
  async append(e) {
    this.events.push(e);
  }
  async listByMeeting(tenantId, workspaceId, meetingId) {
    return this.events.filter((e) => e.meetingId === meetingId && scopeMatch(e, tenantId, workspaceId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
};
function buildInMemoryRepos() {
  const meeting = new InMemoryMeetingRepo();
  const audio = new InMemoryAudioAssetRepo();
  const transcript = new InMemoryTranscriptRepo();
  const analysisRun = new InMemoryAnalysisRunRepo();
  const meetingAnalysis = new InMemoryMeetingAnalysisRepo(
    () => meeting,
    () => analysisRun
  );
  const audit = new InMemoryAuditRepo();
  return {
    meeting,
    audio,
    transcript,
    analysisRun,
    meetingAnalysis,
    audit
  };
}

// src/infrastructure/storage/in-memory.ts
var InMemoryAudioStorage = class {
  constructor(refBuilder) {
    this.refBuilder = refBuilder;
  }
  blobs = /* @__PURE__ */ new Map();
  buildRef(tenantId, workspaceId, meetingId, assetId) {
    return this.refBuilder.build(tenantId, workspaceId, meetingId, assetId);
  }
  async put(ref, bytes, _mimeType) {
    this.blobs.set(ref, bytes);
  }
  async get(ref) {
    return this.blobs.get(ref) ?? null;
  }
  async delete(ref) {
    this.blobs.delete(ref);
  }
  async exists(ref) {
    return this.blobs.has(ref);
  }
};

// src/modules/media/domain/storage.ts
var TenantScopedRefBuilder = class {
  build(tenantId, workspaceId, meetingId, assetId) {
    return `tenants/${tenantId}/workspaces/${workspaceId}/media/${assetId}`;
  }
};

// src/infrastructure/audit/repo-audit-port.ts
import { randomUUID } from "node:crypto";
var RepoAuditPort = class {
  constructor(repo) {
    this.repo = repo;
  }
  async record(event) {
    const full = {
      ...event,
      id: randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.repo.append(full);
  }
};

// src/infrastructure/providers/factory.ts
import OpenAI2 from "openai";

// src/infrastructure/providers/fake-transcription.ts
var FakeTranscriptionProvider = class {
  name = "fake";
  async transcribe(input) {
    if (!(input.audio.bytes instanceof Uint8Array) || input.audio.bytes.length === 0) {
      throw new Error("FakeTranscriptionProvider requires real audio bytes");
    }
    void input.audio.fileName;
    void input.audio.mimeType;
    return {
      language: "en",
      content: "Team agreed to launch the beta on the 15th. Priya owns the launch checklist. We decided to defer the billing integration. Rajeev will draft the RFC by Friday.",
      segments: [
        { speaker: "Priya", startMs: 0, endMs: 4e3, text: "We will launch the beta on the 15th; I own the checklist." },
        { speaker: "Rajeev", startMs: 4e3, endMs: 8e3, text: "I will draft the RFC by Friday." },
        { speaker: null, startMs: 8e3, endMs: 11e3, text: "We decided to defer the billing integration." }
      ]
    };
  }
};

// src/infrastructure/providers/fake-analysis.ts
import { randomUUID as randomUUID2 } from "node:crypto";
var FakeAnalysisProvider = class {
  name = "fake";
  async analyze(input) {
    const text = input.transcriptContent;
    const lowered = text.toLowerCase();
    const decisions = [];
    const proposedActions = [];
    const risks = [];
    const topics = ["launch", "billing", "planning", "demo", "publication", "security", "deployment"].filter((t) => lowered.includes(t));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (/pasted-transcript workflow.*primary public demo/i.test(text)) {
      decisions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Use pasted-transcript workflow as the primary public demo path.",
        rationale: "The team explicitly marks this path as the most reliable demo route.",
        sourceEvidence: "...pasted-transcript workflow will be the primary public demo...",
        confidence: 0.94,
        createdAt: now
      });
    }
    if (/publish the current prototype.*experimental-use warning/i.test(text)) {
      decisions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Publish with explicit experimental/prototype warning.",
        rationale: "Publication is allowed only with transparent prototype disclosure.",
        sourceEvidence: "...publish the current prototype with an explicit experimental-use warning.",
        confidence: 0.9,
        createdAt: now
      });
    }
    if (/production deployment.*blocked until authentication and durable persistence/i.test(text)) {
      decisions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Keep production deployment blocked until authentication and durable persistence are implemented.",
        rationale: "Authentication and persistence are explicit production blockers.",
        sourceEvidence: "...production deployment must remain blocked until authentication and durable persistence...",
        confidence: 0.96,
        createdAt: now
      });
      risks.push("Production risk: authentication and durable persistence are missing prerequisites.");
    }
    if (/risk is that the vercel deployment may not match the latest github commit/i.test(text)) {
      risks.push("Vercel traceability risk: deployed application may not match latest GitHub commit.");
    }
    const mayaBy = text.match(/Maya:\s*I will verify [^\n]*? by (\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (mayaBy) {
      const due = parseHumanDate(mayaBy[1] ?? "");
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Verify GitHub and Wiki navigation.",
        ownerName: "Maya",
        ownerReference: null,
        dueDate: due,
        priority: "MEDIUM",
        targetSystem: "INTERNAL",
        actionType: "VALIDATION",
        rationale: "Public surface link integrity is required before publication.",
        sourceEvidence: "Maya: I will verify the GitHub and Wiki navigation by ...",
        confidence: 0.93,
        riskLevel: "MEDIUM",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    const priyaBy = text.match(/Priya:\s*I will confirm the deployed commit and run the public smoke test by (\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (priyaBy) {
      const due = parseHumanDate(priyaBy[1] ?? "");
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Confirm deployed commit and run public smoke test.",
        ownerName: "Priya",
        ownerReference: null,
        dueDate: due,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "VALIDATION",
        rationale: "Release traceability and smoke validation gate publication quality.",
        sourceEvidence: "Priya: I will confirm the deployed commit and run the public smoke test by ...",
        confidence: 0.95,
        riskLevel: "HIGH",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    if (/propose we approve publication after the link scan, security tests, and public demo all pass/i.test(text)) {
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Approve publication only after link scan, security tests, and public demo pass.",
        ownerName: "Daniel",
        ownerReference: null,
        dueDate: null,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "APPROVAL_GATE",
        rationale: "Publication should remain gated by objective checks.",
        sourceEvidence: "Daniel: I propose we approve publication after the link scan, security tests, and public demo all pass.",
        confidence: 0.92,
        riskLevel: "HIGH",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    if (/launch/i.test(text)) {
      decisions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Launch the beta on the 15th.",
        rationale: "Team consensus to ship beta.",
        sourceEvidence: "Team agreed to launch the beta on the 15th.",
        confidence: 0.9,
        createdAt: now
      });
      const ownerMatch = text.match(/([A-Z][a-z]+)\s+owns? the launch/i);
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Complete the beta launch checklist.",
        ownerName: ownerMatch ? ownerMatch[1] ?? null : null,
        ownerReference: null,
        dueDate: /15th/.test(text) ? isoForDay(15) : null,
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "TASK",
        rationale: "Required for beta launch.",
        sourceEvidence: "Team agreed to launch the beta on the 15th.",
        confidence: 0.85,
        riskLevel: "MEDIUM",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    if (/rfc/i.test(text)) {
      const ownerMatch = text.match(/([A-Z][a-z]+)\s+will draft the RFC/i);
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Draft the integration RFC.",
        ownerName: ownerMatch ? ownerMatch[1] ?? null : null,
        ownerReference: null,
        dueDate: /friday/i.test(text) ? isoForWeekday(5) : null,
        priority: "MEDIUM",
        targetSystem: "INTERNAL",
        actionType: "DOC",
        rationale: "Needed before integration work.",
        sourceEvidence: "Rajeev will draft the RFC by Friday.",
        confidence: 0.8,
        riskLevel: "LOW",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    if (/defer/i.test(text)) {
      risks.push("Billing dependency may resurface post-beta.");
      proposedActions.push({
        id: randomUUID2(),
        meetingId: input.meetingId,
        description: "Defer billing integration to next quarter.",
        ownerName: null,
        ownerReference: null,
        dueDate: null,
        priority: "LOW",
        targetSystem: "INTERNAL",
        actionType: "DECISION",
        rationale: "Reduce scope for beta.",
        sourceEvidence: "We decided to defer the billing integration.",
        confidence: 0.7,
        riskLevel: "LOW",
        status: "PROPOSED",
        createdAt: now,
        updatedAt: now
      });
    }
    const summary = decisions.length || proposedActions.length ? `Extracted ${decisions.length} decision(s), ${proposedActions.length} proposed action(s), and ${risks.length} risk(s).` : "Transcript reviewed; no high-confidence decisions or actions extracted.";
    return {
      id: randomUUID2(),
      meetingId: input.meetingId,
      summary,
      topics,
      decisions,
      proposedActions,
      risks,
      createdAt: now
    };
  }
};
function isoForDay(day) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoForWeekday(dow) {
  const d = /* @__PURE__ */ new Date();
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function parseHumanDate(value) {
  const m = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthName = (m[2] ?? "").toLowerCase();
  const year = Number(m[3]);
  const monthMap = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11
  };
  const month = monthMap[monthName];
  if (month === void 0 || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
}

// src/infrastructure/providers/openai.ts
import OpenAI from "openai";

// src/shared/validation/schemas.ts
import { z as z3 } from "zod";

// src/shared/validation/formats.ts
import { z as z2 } from "zod";
var AudioFormatSchema = z2.enum(["MP3", "WAV", "M4A"]);
var MimeToFormat = {
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/mp4": "M4A"
};
function formatForMime(mime) {
  return MimeToFormat[mime];
}

// src/shared/validation/schemas.ts
var ISO = z3.string().datetime({ offset: true });
var TenantScopeSchema = z3.object({
  tenantId: z3.string().min(1),
  workspaceId: z3.string().min(1)
});
var MeetingStatusSchema = z3.enum([
  "DRAFT",
  "READY",
  "PROCESSING",
  "REVIEW_REQUIRED",
  "COMPLETED",
  "FAILED"
]);
var CreateMeetingInputSchema = z3.object({
  title: z3.string().min(1).max(300),
  meetingType: z3.string().min(1).max(80),
  scheduledAt: ISO
});
var MeetingSchema = TenantScopeSchema.extend({
  id: z3.string().uuid(),
  title: z3.string(),
  meetingType: z3.string(),
  status: MeetingStatusSchema,
  scheduledAt: ISO,
  createdBy: z3.string(),
  createdAt: ISO,
  updatedAt: ISO
});
var AudioSourceSchema = z3.enum(["UPLOAD", "RECORDED", "LIVE_STREAM", "TRANSCRIPT_PASTE", "TRANSCRIPT_IMPORT"]);
var AudioAssetStatusSchema = z3.enum([
  "PENDING",
  "VALIDATING",
  "STORED",
  "TRANSCRIBING",
  "READY",
  "FAILED",
  "REJECTED"
]);
var AudioAssetSchema = TenantScopeSchema.extend({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  source: AudioSourceSchema,
  fileName: z3.string(),
  mimeType: z3.string(),
  format: AudioFormatSchema,
  sizeBytes: z3.number().int().nonnegative(),
  durationSeconds: z3.number().nonnegative(),
  checksum: z3.string(),
  storageReference: z3.string(),
  status: AudioAssetStatusSchema,
  createdAt: ISO,
  updatedAt: ISO
});
var TranscriptSourceSchema = z3.enum(["UPLOAD", "PASTE", "IMPORT", "TRANSCRIPTION"]);
var TranscriptSchema = TenantScopeSchema.extend({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  source: TranscriptSourceSchema,
  language: z3.string().min(2).max(8),
  content: z3.string(),
  segments: z3.array(
    z3.object({
      speaker: z3.string().nullable(),
      startMs: z3.number().nonnegative(),
      endMs: z3.number().nonnegative(),
      text: z3.string()
    })
  ),
  status: z3.enum(["PENDING", "VALIDATING", "READY", "FAILED"]),
  createdAt: ISO,
  updatedAt: ISO
});
var AnalysisRunStatusSchema = z3.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED"
]);
var AnalysisRunSchema = TenantScopeSchema.extend({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  transcriptId: z3.string().uuid(),
  provider: z3.string(),
  model: z3.string(),
  status: AnalysisRunStatusSchema,
  idempotencyKey: z3.string(),
  startedAt: ISO,
  completedAt: ISO.nullable(),
  latencyMs: z3.number().int().nonnegative().nullable(),
  tokenUsage: z3.object({ input: z3.number().int().nonnegative(), output: z3.number().int().nonnegative() }).nullable(),
  errorCode: z3.string().nullable()
});
var DecisionSchema = z3.object({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  description: z3.string().min(1),
  rationale: z3.string(),
  sourceEvidence: z3.string().min(1),
  confidence: z3.number().min(0).max(1),
  createdAt: ISO
});
var ActionStatusSchema = z3.enum([
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXECUTION_PENDING",
  "EXECUTED",
  "EXECUTION_FAILED"
]);
var ProposedActionSchema = z3.object({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  description: z3.string().min(1),
  ownerName: z3.string().nullable(),
  ownerReference: z3.string().nullable(),
  dueDate: ISO.nullable(),
  priority: z3.enum(["HIGH", "MEDIUM", "LOW"]),
  targetSystem: z3.string(),
  actionType: z3.string(),
  rationale: z3.string(),
  sourceEvidence: z3.string().min(1),
  confidence: z3.number().min(0).max(1),
  riskLevel: z3.enum(["LOW", "MEDIUM", "HIGH"]),
  status: ActionStatusSchema,
  createdAt: ISO,
  updatedAt: ISO
});
var MeetingAnalysisSchema = z3.object({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  summary: z3.string(),
  topics: z3.array(z3.string()),
  decisions: z3.array(DecisionSchema),
  proposedActions: z3.array(ProposedActionSchema),
  risks: z3.array(z3.string()),
  createdAt: ISO
});
var ApprovalDecisionSchema = z3.object({
  id: z3.string().uuid(),
  actionId: z3.string().uuid(),
  decision: z3.enum(["APPROVED", "REJECTED"]),
  actorId: z3.string(),
  reason: z3.string().nullable(),
  createdAt: ISO
});
var AuditEventSchema = TenantScopeSchema.extend({
  id: z3.string().uuid(),
  meetingId: z3.string().uuid(),
  entityType: z3.string(),
  entityId: z3.string().uuid(),
  eventType: z3.string(),
  actorType: z3.string(),
  actorId: z3.string(),
  correlationId: z3.string(),
  metadata: z3.record(z3.string(), z3.unknown()),
  createdAt: ISO
});
var TranscriptResultSchema = z3.object({
  language: z3.string(),
  content: z3.string(),
  segments: z3.array(
    z3.object({
      speaker: z3.string().nullable(),
      startMs: z3.number().nonnegative(),
      endMs: z3.number().nonnegative(),
      text: z3.string()
    })
  )
});

// src/shared/security/redaction.ts
var SENSITIVE_PATTERN = /^(authorization|cookie|set[_-]?cookie|api[_-]?key|secret|token|accessToken|access[_-]?token|refreshToken|refresh[_-]?token|password|transcript|audio|audioBytes|rawAudio|content|storageReference|filePath|localPath|signedUrl|fileName)$/i;
function isSensitiveKey(key) {
  return SENSITIVE_PATTERN.test(key);
}
function redact(obj) {
  const seen = /* @__PURE__ */ new WeakSet();
  const MAX_DEPTH = 10;
  function recurse(val, depth) {
    if (depth > MAX_DEPTH) {
      return "[MAX_DEPTH_REACHED]";
    }
    if (val === null || val === void 0) {
      return val;
    }
    if (typeof val !== "object") {
      return val;
    }
    if (seen.has(val)) {
      return "[CIRCULAR]";
    }
    seen.add(val);
    if (Array.isArray(val)) {
      const copy = val.map((item) => recurse(item, depth + 1));
      seen.delete(val);
      return copy;
    }
    if (val instanceof Date) {
      seen.delete(val);
      return val;
    }
    const out = {};
    let keys = [];
    if (val instanceof Error) {
      keys = ["name", "message", "stack", ...Object.keys(val)];
    } else {
      keys = Object.keys(val);
    }
    for (const k of keys) {
      const v = val[k];
      if (isSensitiveKey(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = recurse(v, depth + 1);
      }
    }
    seen.delete(val);
    return out;
  }
  return recurse(obj, 0);
}

// src/shared/logging/logger.ts
var ConsoleSink = class {
  write(entry) {
    const line = JSON.stringify(entry);
    if (entry.level === "error") console.error(line);
    else if (entry.level === "warn") console.warn(line);
    else console.log(line);
  }
};
var AppLogger = class {
  sink = new ConsoleSink();
  setSink(sink) {
    this.sink = sink;
  }
  emit(level, ctx, msg) {
    const entry = { ts: (/* @__PURE__ */ new Date()).toISOString(), level, msg, ...redact(ctx) };
    this.sink.write(entry);
  }
  info(ctx, msg) {
    this.emit("info", ctx, msg);
  }
  warn(ctx, msg) {
    this.emit("warn", ctx, msg);
  }
  error(ctx, msg) {
    this.emit("error", ctx, msg);
  }
};
var logger = new AppLogger();

// src/infrastructure/providers/openai.ts
var OpenAITranscriptionProvider = class {
  constructor(client, model, timeoutMs, maxRetries) {
    this.client = client;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }
  name = "openai";
  async transcribe(input) {
    const { bytes, fileName, mimeType } = input.audio;
    const file = await OpenAI.toFile(new Blob([bytes]), fileName || "audio.bin", {
      type: mimeType || "application/octet-stream"
    });
    let attempt = 0;
    while (true) {
      try {
        const res = await this.client.audio.transcriptions.create(
          {
            file,
            model: this.model
          },
          { timeout: this.timeoutMs }
        );
        const content = typeof res === "string" ? res : res.text ?? "";
        return { language: "en", content, segments: [] };
      } catch (err) {
        if (err instanceof AppError) throw err;
        attempt++;
        if (attempt > this.maxRetries) {
          logger.error({ correlationId: input.correlationId, operation: "transcribe" }, "transcription failed");
          throw new AppError("PROVIDER_ERROR" /* PROVIDER_ERROR */, "Transcription provider error", 502, void 0, true);
        }
      }
    }
  }
};
var OpenAIAnalysisProvider = class {
  constructor(client, model, timeoutMs, maxRetries) {
    this.client = client;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }
  name = "openai";
  async analyze(input) {
    let attempt = 0;
    while (true) {
      try {
        const res = await this.client.chat.completions.create(
          {
            model: this.model,
            temperature: 0,
            response_format: { type: "json_schema", json_schema: { name: "meeting_analysis", schema: analysisJsonSchema() } },
            messages: [
              { role: "system", content: "Extract structured meeting analysis as JSON per schema. Do not fabricate owners/dates; use null if unknown." },
              { role: "user", content: input.transcriptContent }
            ]
          },
          { timeout: this.timeoutMs }
        );
        const raw = res.choices[0]?.message?.content ?? "{}";
        const parsed = MeetingAnalysisSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          throw new AppError("ANALYSIS_FAILED" /* ANALYSIS_FAILED */, "Malformed analysis output rejected", 422);
        }
        return parsed.data;
      } catch (err) {
        if (err instanceof AppError) throw err;
        attempt++;
        if (attempt > this.maxRetries) {
          logger.error({ correlationId: input.correlationId, operation: "analyze" }, "analysis failed");
          throw new AppError("PROVIDER_ERROR" /* PROVIDER_ERROR */, "Analysis provider error", 502, void 0, true);
        }
      }
    }
  }
};
function analysisJsonSchema() {
  return {
    type: "object",
    properties: {
      summary: { type: "string" },
      topics: { type: "array", items: { type: "string" } },
      decisions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            rationale: { type: "string" },
            sourceEvidence: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["description", "rationale", "sourceEvidence", "confidence"]
        }
      },
      proposedActions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            ownerName: { type: ["string", "null"] },
            dueDate: { type: ["string", "null"] },
            priority: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            targetSystem: { type: "string" },
            actionType: { type: "string" },
            rationale: { type: "string" },
            sourceEvidence: { type: "string" },
            confidence: { type: "number" },
            riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }
          },
          required: ["description", "ownerName", "dueDate", "priority", "targetSystem", "actionType", "rationale", "sourceEvidence", "confidence", "riskLevel"]
        }
      },
      risks: { type: "array", items: { type: "string" } }
    },
    required: ["summary", "topics", "decisions", "proposedActions", "risks"]
  };
}

// src/infrastructure/providers/factory.ts
function buildProviders(cfg) {
  if (cfg.TRANSCRIPTION_PROVIDER === "openai") {
    const key = cfg.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required for openai transcription provider");
    const client = new OpenAI2({ apiKey: key });
    return {
      transcription: new OpenAITranscriptionProvider(client, cfg.TRANSCRIPTION_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES),
      analysis: buildAnalysis(cfg, client)
    };
  }
  return { transcription: new FakeTranscriptionProvider(), analysis: new FakeAnalysisProvider() };
}
function buildAnalysis(cfg, client) {
  if (cfg.ANALYSIS_PROVIDER === "openai") {
    return new OpenAIAnalysisProvider(client, cfg.ANALYSIS_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES);
  }
  return new FakeAnalysisProvider();
}

// src/shared/observability/health.ts
function liveness() {
  const commit = (process.env.VITE_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "dev").substring(0, 7);
  const version = process.env.VITE_APP_VERSION || "0.3.0";
  return { live: true, version, commit };
}
async function readiness(deps) {
  const details = {};
  if (deps.persistence) {
    details.persistence = await deps.persistence.ready().catch(() => false);
  }
  let providersOk = true;
  for (const p of deps.providers ?? []) {
    providersOk = providersOk && await p.ready().catch(() => false);
  }
  if (deps.providers && deps.providers.length > 0) details.providers = providersOk;
  const ready = Object.values(details).every(Boolean);
  return { status: ready ? "ok" : "degraded", live: true, ready, details };
}

// src/modules/meetings/application/create-meeting.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// src/modules/app-context.ts
function auditMeta(ctx, meetingId, correlationId) {
  return {
    tenantId: ctx.identity.tenantId,
    workspaceId: ctx.identity.workspaceId,
    meetingId,
    actorType: ctx.identity.actorType,
    actorId: ctx.identity.actorId,
    correlationId
  };
}

// src/modules/meetings/application/create-meeting.ts
var CreateMeeting = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(input, correlationId) {
    const parsed = CreateMeetingInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Invalid meeting input", 400, parsed.error.issues);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const meeting = {
      id: randomUUID3(),
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      title: parsed.data.title,
      meetingType: parsed.data.meetingType,
      status: "DRAFT",
      scheduledAt: parsed.data.scheduledAt,
      createdBy: this.ctx.identity.actorId,
      createdAt: now,
      updatedAt: now
    };
    await this.ctx.repos.meeting.save(meeting);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meeting.id, correlationId),
      entityType: "MEETING",
      entityId: meeting.id,
      eventType: "MEETING_CREATED",
      metadata: { title: meeting.title }
    });
    logger.info({ operation: "CreateMeeting", correlationId, outcome: "success" }, "meeting created");
    return meeting;
  }
};

// src/modules/meetings/application/get-meeting.ts
var GetMeeting = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId) {
    const m = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!m) throw new AppError("MEETING_NOT_FOUND" /* MEETING_NOT_FOUND */, "Meeting not found", 404);
    return m;
  }
};

// src/modules/meetings/application/submit-transcript.ts
import { randomUUID as randomUUID4 } from "node:crypto";
var SubmitMeetingTranscript = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId, input, correlationId) {
    if (!input || typeof input.content !== "string") {
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Transcript content is required and must be a string", 400);
    }
    const min = 10;
    const max = 5e4;
    const content = input.content.replace(/\s+/g, " ").trim();
    if (content.length < min) throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Transcript too short", 400, { received: content.length, allowed: min });
    if (content.length > max) throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Transcript too long", 400, { received: content.length, allowed: max });
    const meeting = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!meeting) throw new AppError("MEETING_NOT_FOUND" /* MEETING_NOT_FOUND */, "Meeting not found", 404);
    const existing = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const dup = existing.find((t) => t.content === content && t.source === (input.source ?? "PASTE"));
    if (dup) {
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "TRANSCRIPT",
        entityId: dup.id,
        eventType: "TRANSCRIPT_DUPLICATE_SKIPPED",
        metadata: {}
      });
      return dup;
    }
    const id = randomUUID4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const transcript = {
      id,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      source: input.source ?? "PASTE",
      language: input.language ?? "en",
      content,
      segments: [],
      status: "READY",
      createdAt: now,
      updatedAt: now
    };
    await this.ctx.repos.transcript.save(transcript);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meetingId, correlationId),
      entityType: "TRANSCRIPT",
      entityId: id,
      eventType: "TRANSCRIPT_SUBMITTED",
      metadata: { source: transcript.source, length: content.length }
    });
    logger.info({ operation: "SubmitMeetingTranscript", correlationId, outcome: "success" }, "transcript submitted");
    return transcript;
  }
};

// src/modules/media/application/upload-audio.ts
import { randomUUID as randomUUID5 } from "node:crypto";

// src/shared/validation/media.ts
import { createHash } from "node:crypto";
var CONTROL_CHARS = /[ --]/g;
var PATH_SEP = /[\\/\\\\]/g;
function sanitizeFilename(name) {
  return name.replace(PATH_SEP, "_").replace(/\.\./g, "").replace(CONTROL_CHARS, "").replace(/ /g, "").slice(0, 255) || "untitled";
}
function checksumOf(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
var EXT_MIME = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4"
};
function extensionOf(fileName) {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : void 0;
}
function isExtensionMimeConsistent(fileName, mimeType) {
  const ext = extensionOf(fileName);
  if (!ext) return false;
  return EXT_MIME[ext] === mimeType;
}

// src/modules/media/application/upload-audio.ts
var UploadMeetingAudio = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId, input, correlationId) {
    const cfg = this.ctx.config;
    const meeting = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!meeting) throw new AppError("MEETING_NOT_FOUND" /* MEETING_NOT_FOUND */, "Meeting not found", 404);
    const mime = input.file.mimeType;
    if (!isVideoEnabled(cfg) && (mime.startsWith("video/") || mime === "video/mp4")) {
      throw new AppError("UNSUPPORTED_MEDIA_TYPE" /* UNSUPPORTED_MEDIA_TYPE */, "Only audio files are supported (MP3, WAV, M4A).", 415);
    }
    const allowed = allowedMimeTypes(cfg);
    if (!allowed.includes(mime)) {
      throw new AppError("UNSUPPORTED_MEDIA_TYPE" /* UNSUPPORTED_MEDIA_TYPE */, "Unsupported audio MIME type", 415, { received: mime, allowed });
    }
    const fmt = formatForMime(mime);
    if (!fmt) throw new AppError("UNSUPPORTED_MEDIA_TYPE" /* UNSUPPORTED_MEDIA_TYPE */, "Unsupported audio format", 415);
    if (input.file.bytes.length === 0) throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Empty file rejected", 400);
    if (input.file.bytes.length > cfg.AUDIO_MAX_BYTES)
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "File exceeds maximum size", 400, { received: input.file.bytes.length, allowed: cfg.AUDIO_MAX_BYTES });
    if (!isExtensionMimeConsistent(input.file.fileName, mime))
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "File extension and MIME type mismatch", 400, { received: input.file.fileName, allowed: mime });
    const duration = input.file.durationSeconds ?? 0;
    if (duration > cfg.AUDIO_MAX_SECONDS)
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Audio duration exceeds limit", 400, { received: duration, allowed: cfg.AUDIO_MAX_SECONDS });
    const checksum = checksumOf(input.file.bytes);
    const existing = await this.ctx.repos.audio.findByChecksum(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId, checksum);
    if (existing) {
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "AUDIO_ASSET",
        entityId: existing.id,
        eventType: "AUDIO_DUPLICATE_SKIPPED",
        metadata: { checksum }
      });
      return existing;
    }
    const id = randomUUID5();
    const ref = this.ctx.storage.buildRef(
      this.ctx.identity.tenantId,
      this.ctx.identity.workspaceId,
      meetingId,
      id
    );
    await this.ctx.storage.put(ref, input.file.bytes, mime);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const asset = {
      id,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      source: "UPLOAD",
      fileName: sanitizeFilename(input.file.fileName),
      mimeType: mime,
      format: fmt,
      sizeBytes: input.file.bytes.length,
      durationSeconds: duration,
      checksum,
      storageReference: ref,
      status: "STORED",
      createdAt: now,
      updatedAt: now
    };
    await this.ctx.repos.audio.save(asset);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meetingId, correlationId),
      entityType: "AUDIO_ASSET",
      entityId: id,
      eventType: "AUDIO_UPLOADED",
      metadata: { format: fmt, sizeBytes: asset.sizeBytes }
    });
    logger.info({ operation: "UploadMeetingAudio", correlationId, outcome: "success" }, "audio stored");
    return asset;
  }
};

// src/modules/transcription/application/transcribe-audio.ts
import { randomUUID as randomUUID6 } from "node:crypto";
var TranscribeMeetingAudio = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId, correlationId) {
    const audio = await this.ctx.repos.audio.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const target = audio.find((a) => a.status === "STORED" || a.status === "READY") ?? audio[0];
    if (!target) throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "No audio asset to transcribe", 400);
    const exists = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const prior = exists.find((t) => t.source === "TRANSCRIPTION");
    if (prior) return prior;
    const bytes = await this.ctx.storage.get(target.storageReference);
    if (!bytes) throw new AppError("STORAGE_OBJECT_MISSING" /* STORAGE_OBJECT_MISSING */, "Audio bytes unavailable for transcription", 410, { storageReference: "[redacted-content]" });
    try {
      const result = await this.ctx.transcription.transcribe({
        audio: { bytes, fileName: target.fileName, mimeType: target.mimeType },
        correlationId
      });
      const id = randomUUID6();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const transcript = {
        id,
        tenantId: this.ctx.identity.tenantId,
        workspaceId: this.ctx.identity.workspaceId,
        meetingId,
        source: "TRANSCRIPTION",
        language: result.language,
        content: result.content,
        segments: result.segments,
        status: "READY",
        createdAt: now,
        updatedAt: now
      };
      await this.ctx.repos.transcript.save(transcript);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "TRANSCRIPT",
        entityId: id,
        eventType: "TRANSCRIPT_CREATED",
        metadata: { source: "TRANSCRIPTION" }
      });
      logger.info({ operation: "TranscribeMeetingAudio", correlationId, outcome: "success" }, "transcription complete");
      return transcript;
    } catch (err) {
      logger.error({ operation: "TranscribeMeetingAudio", correlationId, outcome: "failure" }, "transcription failed");
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING",
        entityId: meetingId,
        eventType: "TRANSCRIPTION_FAILED",
        metadata: { error: String(err.message) }
      });
      throw new AppError("TRANSCRIPTION_FAILED" /* TRANSCRIPTION_FAILED */, "Transcription failed; meeting remains recoverable", 502, void 0, true);
    }
  }
};

// src/modules/analysis/application/analyze-transcript.ts
import { randomUUID as randomUUID7 } from "node:crypto";
var AnalyzeMeetingTranscript = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId, correlationId) {
    const transcripts = await this.ctx.repos.transcript.findByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    const transcript = transcripts.find((t) => t.status === "READY");
    if (!transcript) throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "No valid transcript to analyze", 400);
    const idempotencyKey = `analyze:${transcript.id}`;
    const existingRun = await this.ctx.repos.analysisRun.findByIdempotencyKey(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, idempotencyKey);
    if (existingRun && existingRun.status === "COMPLETED") {
      const existing = await this.ctx.repos.meetingAnalysis.getByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
      if (existing) return existing;
    }
    const runId = randomUUID7();
    const start = Date.now();
    const run = {
      id: runId,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      transcriptId: transcript.id,
      provider: this.ctx.analysis.name,
      model: this.ctx.analysis.name === "openai" ? this.ctx.config.ANALYSIS_MODEL : "fake",
      status: "RUNNING",
      idempotencyKey,
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: null,
      latencyMs: null,
      tokenUsage: null,
      errorCode: null
    };
    await this.ctx.repos.analysisRun.save(run);
    try {
      const result = await this.ctx.analysis.analyze({ transcriptContent: transcript.content, language: transcript.language, meetingId, correlationId });
      const validated = MeetingAnalysisSchema.safeParse(result);
      if (!validated.success) {
        throw new AppError("ANALYSIS_FAILED" /* ANALYSIS_FAILED */, "Malformed analysis output rejected", 422);
      }
      const analysis = { ...validated.data, id: randomUUID7(), meetingId };
      await this.ctx.repos.meetingAnalysis.save(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, analysis);
      for (const d of analysis.decisions) await this.ctx.repos.meetingAnalysis.saveDecision(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, d);
      for (const a of analysis.proposedActions) await this.ctx.repos.meetingAnalysis.saveAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, a);
      run.status = "COMPLETED";
      run.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      run.latencyMs = Date.now() - start;
      await this.ctx.repos.analysisRun.save(run);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING_ANALYSIS",
        entityId: analysis.id,
        eventType: "ANALYSIS_COMPLETED",
        metadata: { decisions: analysis.decisions.length, actions: analysis.proposedActions.length }
      });
      logger.info({ operation: "AnalyzeMeetingTranscript", correlationId, outcome: "success", durationMs: run.latencyMs }, "analysis complete");
      return analysis;
    } catch (err) {
      run.status = "FAILED";
      run.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      run.errorCode = err.code ?? "ANALYSIS_FAILED" /* ANALYSIS_FAILED */;
      await this.ctx.repos.analysisRun.save(run);
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "MEETING",
        entityId: meetingId,
        eventType: "ANALYSIS_FAILED",
        metadata: { error: String(err.message) }
      });
      logger.error({ operation: "AnalyzeMeetingTranscript", correlationId, outcome: "failure" }, "analysis failed");
      if (err instanceof AppError) throw err;
      throw new AppError("ANALYSIS_FAILED" /* ANALYSIS_FAILED */, "Analysis failed; meeting remains recoverable", 502, void 0, true);
    }
  }
};

// src/modules/analysis/application/get-analysis.ts
var GetMeetingAnalysis = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId) {
    const a = await this.ctx.repos.meetingAnalysis.getByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!a) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Analysis not found", 404);
    return a;
  }
};

// src/modules/approvals/application/approve-reject.ts
import { randomUUID as randomUUID8 } from "node:crypto";
var ApproveProposedAction = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(actionId, correlationId) {
    const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);
    if (!action) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Action not found", 404);
    if (action.status !== "PROPOSED") throw new AppError("INVALID_STATE_TRANSITION" /* INVALID_STATE_TRANSITION */, "Only PROPOSED actions can be approved", 409, { received: action.status });
    action.status = "APPROVED";
    action.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_APPROVED",
      metadata: { description: action.description }
    });
    logger.info({ operation: "ApproveProposedAction", correlationId, outcome: "success" }, "action approved");
  }
};
var RejectProposedAction = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(actionId, reason, correlationId) {
    const action = await this.ctx.repos.meetingAnalysis.getAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, actionId);
    if (!action) throw new AppError("NOT_FOUND" /* NOT_FOUND */, "Action not found", 404);
    if (!reason || reason.trim().length === 0) throw new AppError("REJECTION_REASON_REQUIRED" /* REJECTION_REASON_REQUIRED */, "Rejection requires a reason", 400);
    if (action.status !== "PROPOSED") throw new AppError("INVALID_STATE_TRANSITION" /* INVALID_STATE_TRANSITION */, "Only PROPOSED actions can be rejected", 409, { received: action.status });
    action.status = "REJECTED";
    action.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.ctx.repos.meetingAnalysis.updateAction(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, action);
    await this.ctx.repos.meetingAnalysis.saveApproval(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, {
      id: randomUUID8(),
      actionId,
      decision: "REJECTED",
      actorId: this.ctx.identity.actorId,
      reason: reason.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, action.meetingId, correlationId),
      entityType: "PROPOSED_ACTION",
      entityId: actionId,
      eventType: "ACTION_REJECTED",
      metadata: { reason: reason.trim() }
    });
    logger.info({ operation: "RejectProposedAction", correlationId, outcome: "success" }, "action rejected");
  }
};

// src/modules/audit/application/list-audit.ts
var ListMeetingAuditEvents = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async execute(meetingId) {
    const m = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!m) throw new AppError("MEETING_NOT_FOUND" /* MEETING_NOT_FOUND */, "Meeting not found", 404);
    return this.ctx.repos.audit.listByMeeting(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
  }
};

// src/app/index.ts
function buildApp() {
  const app2 = new Hono();
  const cfg = getConfig();
  const repos = buildInMemoryRepos();
  const storage = new InMemoryAudioStorage(new TenantScopedRefBuilder());
  const providers = buildProviders(cfg);
  const audit = new RepoAuditPort(repos.audit);
  const identity = new DevIdentityAdapter(cfg.AUTH_MODE);
  app2.onError((err, c) => {
    const correlationId = c.get("correlationId") || randomUUID9();
    if (err instanceof AppError) {
      return c.json({ error: { code: err.code, message: err.message, details: err.details, retryable: err.retryable }, correlationId }, err.httpStatus);
    }
    logger.error({ correlationId, outcome: "failure" }, "unhandled error: " + err.message);
    return c.json({ error: { code: "INTERNAL" /* INTERNAL */, message: "Internal error" }, correlationId }, 500);
  });
  app2.use("*", async (c, next) => {
    c.set("correlationId", randomUUID9());
    await next();
  });
  function ctx(c) {
    const headers = {};
    c.req.raw.headers.forEach((v, k) => headers[k.toLowerCase()] = v);
    const id = identity.resolve(headers);
    return { repos, storage, transcription: providers.transcription, analysis: providers.analysis, audit, identity: id, config: cfg };
  }
  app2.get("/api/health/live", (c) => c.json(liveness()));
  app2.get("/api/health/ready", async (c) => c.json(await readiness({ persistence: { ready: async () => true } })));
  const v1 = new Hono();
  v1.post("/meetings", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => null);
    const meeting = await new CreateMeeting(ctx(c)).execute(body, correlationId);
    return c.json({ data: meeting, correlationId }, 201);
  });
  v1.get("/meetings/:meetingId", async (c) => {
    const meeting = await new GetMeeting(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: meeting, correlationId: c.get("correlationId") });
  });
  v1.post("/meetings/:meetingId/audio", async (c) => {
    const correlationId = c.get("correlationId");
    const form = await c.req.parseBody({ all: true }).catch(() => null);
    const file = form?.["file"];
    if (!file || typeof file.arrayBuffer !== "function") {
      throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Missing audio file", 400);
    }
    const f = file;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const asset = await new UploadMeetingAudio(ctx(c)).execute(
      c.req.param("meetingId"),
      { file: { bytes, fileName: f.name, mimeType: f.type || "application/octet-stream" } },
      correlationId
    );
    return c.json({ data: asset, correlationId }, 201);
  });
  v1.post("/meetings/:meetingId/transcript", async (c) => {
    const correlationId = c.get("correlationId");
    const body = await c.req.json().catch(() => ({}));
    const transcript = await new SubmitMeetingTranscript(ctx(c)).execute(c.req.param("meetingId"), body ?? {}, correlationId);
    return c.json({ data: transcript, correlationId }, 201);
  });
  v1.post("/meetings/:meetingId/transcription", async (c) => {
    const t = await new TranscribeMeetingAudio(ctx(c)).execute(c.req.param("meetingId"), c.get("correlationId"));
    return c.json({ data: t, correlationId: c.get("correlationId") });
  });
  v1.post("/meetings/:meetingId/analysis", async (c) => {
    const a = await new AnalyzeMeetingTranscript(ctx(c)).execute(c.req.param("meetingId"), c.get("correlationId"));
    return c.json({ data: a, correlationId: c.get("correlationId") }, 201);
  });
  v1.get("/meetings/:meetingId/analysis", async (c) => {
    const a = await new GetMeetingAnalysis(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: a, correlationId: c.get("correlationId") });
  });
  v1.get("/meetings/:meetingId/audit", async (c) => {
    const events = await new ListMeetingAuditEvents(ctx(c)).execute(c.req.param("meetingId"));
    return c.json({ data: events, correlationId: c.get("correlationId") });
  });
  v1.post("/actions/:actionId/approve", async (c) => {
    await new ApproveProposedAction(ctx(c)).execute(c.req.param("actionId"), c.get("correlationId"));
    return c.json({ data: { approved: true }, correlationId: c.get("correlationId") });
  });
  v1.post("/actions/:actionId/reject", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    await new RejectProposedAction(ctx(c)).execute(c.req.param("actionId"), body?.reason ?? "", c.get("correlationId"));
    return c.json({ data: { rejected: true }, correlationId: c.get("correlationId") });
  });
  app2.route("/api/v1", v1);
  return app2;
}

// api/server.ts
if (!process.env.VITE_GIT_COMMIT_SHA) {
  process.env.VITE_GIT_COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
}
if (!process.env.VITE_APP_VERSION) {
  process.env.VITE_APP_VERSION = "0.3.0";
}
var app = buildApp();
var GET = handle(app);
var POST = handle(app);
var PUT = handle(app);
var DELETE = handle(app);
var OPTIONS = handle(app);
export {
  DELETE,
  GET,
  OPTIONS,
  POST,
  PUT
};
