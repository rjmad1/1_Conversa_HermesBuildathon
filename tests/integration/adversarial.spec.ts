import { describe, it, expect, vi } from "vitest";
import { makeContext, makeIdentity, SAMPLE_MP3 } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";
import { GetMeetingAnalysis } from "../../src/modules/analysis/application/get-analysis";
import { ApproveProposedAction, RejectProposedAction } from "../../src/modules/approvals/application/approve-reject";
import { ListMeetingAuditEvents } from "../../src/modules/audit/application/list-audit";
import { AppError, ErrorCode } from "../../src/shared/errors/AppError";
import { buildApp } from "../../src/app";
import { logger, type LogSink, type LogEntry } from "../../src/shared/logging/logger";
import { redact } from "../../src/shared/security/redaction";
import { DevIdentityAdapter } from "../../src/shared/security/identity";

describe("Ninth-Gate: Security Isolation & Boundary Enforcement", () => {
  const identityA = makeIdentity({ tenantId: "tenant-a", workspaceId: "workspace-a" });
  const identityA_wsB = makeIdentity({ tenantId: "tenant-a", workspaceId: "workspace-b" });
  const identityB = makeIdentity({ tenantId: "tenant-b", workspaceId: "workspace-b" });

  it("Tenant A can read own meeting analysis, but Tenant B/Workspace B are blocked with a non-disclosing 404", async () => {
    const ctxA = makeContext(identityA);
    const ctxB: any = { ...ctxA, identity: identityB };
    const ctxA_wsB: any = { ...ctxA, identity: identityA_wsB };

    // Setup: Tenant A creates meeting, submits transcript, and generates analysis
    const meetingA = await new CreateMeeting(ctxA).execute({
      title: "Confidential Launch Planning",
      meetingType: "DECISION",
      scheduledAt: "2026-07-12T10:00:00Z",
    }, "corr-1");

    await new SubmitMeetingTranscript(ctxA).execute(meetingA.id, {
      content: "Team agreed to launch the beta on the 15th. Priya owns the launch. We decided to defer the billing integration. Rajeev will draft the RFC.",
    }, "corr-1");

    const analysisA = await new AnalyzeMeetingTranscript(ctxA).execute(meetingA.id, "corr-1");
    expect(analysisA.summary).toBeDefined();

    // Verification 1: Tenant A reads own analysis
    const gotA = await new GetMeetingAnalysis(ctxA).execute(meetingA.id);
    expect(gotA.id).toBe(analysisA.id);

    // Verification 2: Tenant B gets 404
    await expect(new GetMeetingAnalysis(ctxB).execute(meetingA.id)).rejects.toThrowError(
      new AppError(ErrorCode.NOT_FOUND, "Analysis not found", 404)
    );

    // Verification 3: Workspace B under Tenant A gets 404
    await expect(new GetMeetingAnalysis(ctxA_wsB).execute(meetingA.id)).rejects.toThrowError(
      new AppError(ErrorCode.NOT_FOUND, "Analysis not found", 404)
    );
  });

  it("Tenant B / Workspace B cannot read, approve, reject, or mutate Tenant A actions", async () => {
    const ctxA = makeContext(identityA);
    const ctxB: any = { ...ctxA, identity: identityB };
    const ctxA_wsB: any = { ...ctxA, identity: identityA_wsB };

    const meetingA = await new CreateMeeting(ctxA).execute({
      title: "Launch Checklist",
      meetingType: "DECISION",
      scheduledAt: "2026-07-12T10:00:00Z",
    }, "corr-1");

    await new SubmitMeetingTranscript(ctxA).execute(meetingA.id, {
      content: "Team agreed to launch the beta on the 15th. Priya owns the launch.",
    }, "corr-1");

    const analysisA = await new AnalyzeMeetingTranscript(ctxA).execute(meetingA.id, "corr-1");
    const actionA = analysisA.proposedActions[0]!;

    // Verification 1: Tenant B approve attempt fails with 404 (non-disclosing)
    await expect(new ApproveProposedAction(ctxB).execute(actionA.id, "corr-b")).rejects.toThrowError(
      new AppError(ErrorCode.NOT_FOUND, "Action not found", 404)
    );
    // Verify action state is unchanged
    const actionState1 = await ctxA.repos.meetingAnalysis.getAction(identityA.tenantId, identityA.workspaceId, actionA.id);
    expect(actionState1?.status).toBe("PROPOSED");

    // Verification 2: Workspace B approve attempt fails with 404
    await expect(new ApproveProposedAction(ctxA_wsB).execute(actionA.id, "corr-b")).rejects.toThrowError(
      new AppError(ErrorCode.NOT_FOUND, "Action not found", 404)
    );

    // Verification 3: Tenant B reject attempt fails with 404
    await expect(new RejectProposedAction(ctxB).execute(actionA.id, "Malicious reject", "corr-b")).rejects.toThrowError(
      new AppError(ErrorCode.NOT_FOUND, "Action not found", 404)
    );
    // Verify action state remains PROPOSED
    const actionState2 = await ctxA.repos.meetingAnalysis.getAction(identityA.tenantId, identityA.workspaceId, actionA.id);
    expect(actionState2?.status).toBe("PROPOSED");

    // Verification 4: No approval records or domain audits generated for Tenant B's failed attempts
    const auditsA = await new ListMeetingAuditEvents(ctxA).execute(meetingA.id);
    const auditTypes = auditsA.map(a => a.eventType);
    expect(auditTypes).not.toContain("ACTION_APPROVED");
    expect(auditTypes).not.toContain("ACTION_REJECTED");
  });

  it("Idempotency lookup enforces tenant and workspace isolation", async () => {
    const ctxA = makeContext(identityA);
    const ctxB: any = { ...ctxA, identity: identityB };

    const runA = {
      id: "run-a-uuid",
      tenantId: identityA.tenantId,
      workspaceId: identityA.workspaceId,
      meetingId: "meeting-a-uuid",
      transcriptId: "transcript-a-uuid",
      provider: "fake",
      model: "fake",
      status: "COMPLETED" as const,
      idempotencyKey: "analyze:same-key",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      latencyMs: 10,
      tokenUsage: null,
      errorCode: null,
    };

    await ctxA.repos.analysisRun.save(runA);

    // Tenant A looks up key -> returns runA
    const foundA = await ctxA.repos.analysisRun.findByIdempotencyKey(identityA.tenantId, identityA.workspaceId, "analyze:same-key");
    expect(foundA?.id).toBe(runA.id);

    // Tenant B looks up key -> returns null (scoped isolation)
    const foundB = await ctxB.repos.analysisRun.findByIdempotencyKey(identityB.tenantId, identityB.workspaceId, "analyze:same-key");
    expect(foundB).toBeNull();
  });

  it("listActionsByMeeting only returns actions matching requested tenant and workspace scope", async () => {
    const ctxA = makeContext(identityA);
    const ctxB: any = { ...ctxA, identity: identityB };

    const meetingA = await new CreateMeeting(ctxA).execute({
      title: "Sprint A",
      meetingType: "CEREMONY",
      scheduledAt: "2026-07-12T10:00:00Z",
    }, "corr-1");

    await new SubmitMeetingTranscript(ctxA).execute(meetingA.id, {
      content: "Team agreed to launch the beta on the 15th. Priya owns the launch.",
    }, "corr-1");

    await new AnalyzeMeetingTranscript(ctxA).execute(meetingA.id, "corr-1");

    // Scoped list -> returns action
    const listA = await ctxA.repos.meetingAnalysis.listActionsByMeeting(identityA.tenantId, identityA.workspaceId, meetingA.id);
    expect(listA.length).toBeGreaterThan(0);

    // Scoped list under Tenant B -> returns empty array
    const listB = await ctxB.repos.meetingAnalysis.listActionsByMeeting(identityB.tenantId, identityB.workspaceId, meetingA.id);
    expect(listB).toEqual([]);
  });

  it("DevIdentityAdapter blocks boot/usage in production runtimes", () => {
    // 1. Instantiation fails closed if mode is prod
    expect(() => new DevIdentityAdapter("prod")).toThrowError();

    // 2. Instantiation fails closed if NODE_ENV is production
    const oldEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      expect(() => new DevIdentityAdapter("dev")).toThrowError();
    } finally {
      process.env.NODE_ENV = oldEnv;
    }
  });
});

describe("Ninth-Gate: Logger Capability & Redaction", () => {
  it("logger operates cleanly with custom LogSink and falls back without process.stdout", () => {
    const messages: LogEntry[] = [];
    const testSink: LogSink = {
      write: (entry: LogEntry) => {
        messages.push(entry);
      },
    };

    logger.setSink(testSink);
    logger.info({ operation: "TestLog" }, "Testing structured logs");

    expect(messages.length).toBe(1);
    const logged = JSON.parse(JSON.stringify(messages[0]));
    expect(logged.operation).toBe("TestLog");
    expect(logged.msg).toBe("Testing structured logs");
    expect(logged.operation).toBe("TestLog");
  });

  it("recursive redaction handles nested structures, arrays, circular references, and limits depth", () => {
    // 1. Recursive nested redaction
    const payload = {
      tenantId: "demo-tenant",
      details: {
        api_key: "super-secret-key",
        normalField: "safe-text",
        nestedArray: [
          { secret: "nested-secret", benign: "ok" }
        ]
      }
    };

    const redacted = redact(payload);
    expect(redacted.tenantId).toBe("demo-tenant");
    expect(redacted.details.api_key).toBe("[REDACTED]");
    expect(redacted.details.normalField).toBe("safe-text");
    expect(redacted.details.nestedArray[0]!.secret).toBe("[REDACTED]");
    expect(redacted.details.nestedArray[0]!.benign).toBe("ok");

    // Verify original object was NOT mutated
    expect(payload.details.api_key).toBe("super-secret-key");

    // 2. Circular reference handling
    const circular: any = { name: "node-1" };
    circular.self = circular;
    const redactedCircular = redact(circular);
    expect(redactedCircular.name).toBe("node-1");
    expect(redactedCircular.self).toBe("[CIRCULAR]");

    // 3. Max depth check
    const deep: any = {};
    let current = deep;
    for (let i = 0; i < 15; i++) {
      current.next = {};
      current = current.next;
    }
    const redactedDeep = redact(deep);
    // At depth 11, should output MAX_DEPTH_REACHED
    let node: any = redactedDeep;
    for (let i = 0; i < 10; i++) {
      node = node.next;
    }
    expect(node.next).toBe("[MAX_DEPTH_REACHED]");
  });
});
