import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LinkupGroundingProvider } from "../../src/infrastructure/providers/linkup";
import { AnalyzeMeetingTranscript } from "../../src/modules/analysis/application/analyze-transcript";
import { makeContext } from "../helpers";
import { CreateMeeting } from "../../src/modules/meetings/application/create-meeting";
import { SubmitMeetingTranscript } from "../../src/modules/meetings/application/submit-transcript";

describe("Linkup Grounding Integration", () => {
  describe("LinkupGroundingProvider", () => {
    it("returns mock grounding links based on query keywords when api key is empty", async () => {
      const provider = new LinkupGroundingProvider();
      const urls = await provider.search("We should set up authentication via Clerk.");
      expect(urls).toContain("https://clerk.com/docs/quickstarts/nextjs");
    });

    it("makes API POST request to Linkup when api key is provided", async () => {
      const originalFetch = globalThis.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { url: "https://real-linkup-result.com/1" },
            { url: "https://real-linkup-result.com/2" },
          ],
        }),
      } as Response);

      globalThis.fetch = mockFetch;

      const provider = new LinkupGroundingProvider("linkup-test-api-key");
      const urls = await provider.search("some topic");

      expect(urls).toEqual([
        "https://real-linkup-result.com/1",
        "https://real-linkup-result.com/2",
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.linkup.so/v1/search",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer linkup-test-api-key",
          }),
        })
      );

      globalThis.fetch = originalFetch;
    });
  });

  describe("End-to-End Analysis Grounding Integration", () => {
    it("attaches grounding links to proposed actions during meeting analysis", async () => {
      const ctx = makeContext();
      const cid = "corr-grounding-test";

      // Create meeting & pasted transcript containing "launch"
      const meeting = await new CreateMeeting(ctx).execute({
        title: "Grounding Test Meeting",
        meetingType: "CEREMONY",
        scheduledAt: "2026-07-12T10:00:00Z",
      }, cid);

      await new SubmitMeetingTranscript(ctx).execute(meeting.id, {
        content: "Let's complete the beta launch checklist and hook up a slack integration. Priya is responsible for it.",
      }, cid);

      // Run analysis
      const analysis = await new AnalyzeMeetingTranscript(ctx).execute(meeting.id, cid);

      expect(analysis.proposedActions).toHaveLength(1);
      const action = analysis.proposedActions[0]!;
      expect(action.sourceEvidence).toContain("Grounding Links:");
      expect(action.sourceEvidence).toContain("https://example.com/search?q=Complete%20the%20beta%20launch%20checklist.");
    });
  });
});
