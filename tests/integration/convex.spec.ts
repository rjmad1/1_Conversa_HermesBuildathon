import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConvexRepositoryAdapter } from "../../src/infrastructure/repositories/convex";
import type { Meeting } from "../../src/shared/validation/schemas";

describe("ConvexRepositoryAdapter", () => {
  describe("In-Memory Fallback Mode", () => {
    it("behaves like standard repositories when convexUrl is not supplied", async () => {
      const adapter = new ConvexRepositoryAdapter();
      const meeting: Meeting = {
        id: "m1",
        tenantId: "t1",
        workspaceId: "w1",
        title: "Test Meeting",
        meetingType: "CEREMONY",
        status: "DRAFT",
        createdBy: "user-1",
        scheduledAt: "2026-07-12T10:00:00Z",
        createdAt: "2026-07-12T10:00:00Z",
        updatedAt: "2026-07-12T10:00:00Z",
      };

      await adapter.meeting.save(meeting);
      const retrieved = await adapter.meeting.get("t1", "w1", "m1");
      expect(retrieved).toEqual(meeting);

      const listed = await adapter.meeting.listByScope("t1", "w1");
      expect(listed).toHaveLength(1);
      expect(listed[0]).toEqual(meeting);

      const empty = await adapter.meeting.get("t1", "w1", "non-existent");
      expect(empty).toBeNull();
    });
  });

  describe("Convex HTTP Client Mode", () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it("makes HTTP calls to Convex deployment when convexUrl is provided", async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes("queries/meetings/get")) {
          return {
            ok: true,
            json: async () => ({
              value: {
                id: "m2",
                tenantId: "t1",
                workspaceId: "w1",
                title: "Convex Meeting",
                meetingType: "CEREMONY",
                status: "CREATED",
                scheduledAt: "2026-07-12T10:00:00Z",
                createdAt: "2026-07-12T10:00:00Z",
                updatedAt: "2026-07-12T10:00:00Z",
              }
            })
          } as Response;
        }
        if (url.includes("mutations/meetings/save")) {
          return {
            ok: true,
            json: async () => ({ value: null })
          } as Response;
        }
        return { ok: true, json: async () => ({ value: [] }) } as Response;
      });

      globalThis.fetch = mockFetch;

      const adapter = new ConvexRepositoryAdapter("https://example.convex.cloud");

      // Save call
      const meeting: Meeting = {
        id: "m2",
        tenantId: "t1",
        workspaceId: "w1",
        title: "Convex Meeting",
        meetingType: "CEREMONY",
        status: "DRAFT",
        createdBy: "user-1",
        scheduledAt: "2026-07-12T10:00:00Z",
        createdAt: "2026-07-12T10:00:00Z",
        updatedAt: "2026-07-12T10:00:00Z",
      };

      await adapter.meeting.save(meeting);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.convex.cloud/api/mutations/meetings/save",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ meeting }),
        })
      );

      // Get call
      const retrieved = await adapter.meeting.get("t1", "w1", "m2");
      expect(retrieved?.title).toBe("Convex Meeting");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.convex.cloud/api/queries/meetings/get",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ tenantId: "t1", workspaceId: "w1", id: "m2" }),
        })
      );
    });

    it("propagates error on fetch status failure", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      globalThis.fetch = mockFetch;

      const adapter = new ConvexRepositoryAdapter("https://example.convex.cloud");

      await expect(adapter.meeting.get("t1", "w1", "m2")).rejects.toThrow(
        "Convex database operation failed: Convex error status: 500"
      );
    });
  });
});
