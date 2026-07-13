import { describe, it, expect } from "vitest";
import { makeContext } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";
import { CryptographicAuditTrail } from "../../src/shared/security/cryptographic-audit";

describe("Cryptographic Audit Chain Integration", () => {
  it("builds a secure cryptographic hash chain and detects tampering", async () => {
    const ctx = makeContext();
    const cid = "corr-audit-test";

    // 1. Run meeting creation, transcription submit, and analysis to generate audit events
    const meeting = await new CreateMeeting(ctx).execute({
      title: "Audit Test Meeting",
      meetingType: "CEREMONY",
      scheduledAt: "2026-07-12T10:00:00Z",
    }, cid);

    await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
      content: "Daniel proposes beta launch check.",
    }, cid);

    await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);

    // 2. Fetch the audit chain from the repository
    const events = await ctx.repos.audit.listByMeeting(ctx.identity.tenantId, ctx.identity.workspaceId, meeting.id);

    expect(events.length).toBeGreaterThanOrEqual(2);

    const firstEvent = events[0]!;
    const secondEvent = events[1]!;

    // Verify first event previousHash is "0"
    expect(firstEvent.previousHash).toBe("0");
    expect(firstEvent.hash).toBeTruthy();

    // Verify second event links to first
    expect(secondEvent.previousHash).toBe(firstEvent.hash);

    // Verify the entire chain is valid
    const isValidBefore = CryptographicAuditTrail.verifyChain(events);
    expect(isValidBefore).toBe(true);

    // 3. Tamper with the log (modify metadata of the first event)
    const tamperedEvents = JSON.parse(JSON.stringify(events));
    tamperedEvents[0]!.metadata = { tamperedField: "injected" };

    const isValidAfter = CryptographicAuditTrail.verifyChain(tamperedEvents);
    expect(isValidAfter).toBe(false);
  });
});
