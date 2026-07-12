import { describe, it, expect, afterEach } from "vitest";
import { logger, setLogSink, type LogSink, type LogEntry } from "../../src/shared/logging/logger";

class BufferSink implements LogSink {
  lines: LogEntry[] = [];
  write(entry: LogEntry): void {
    this.lines.push(entry);
  }
}

describe("logger portability", () => {
  afterEach(() => setLogSink(null));

  it("emits structured JSON via injected sink", () => {
    const buf = new BufferSink();
    setLogSink(buf);
    logger.info({ operation: "Test", correlationId: "c1", outcome: "success" }, "hello");
    expect(buf.lines).toHaveLength(1);
    const first = buf.lines[0]!;
    expect(first.msg).toBe("hello");
    expect(first.operation).toBe("Test");
    expect(first.level).toBe("info");
    expect(typeof first.ts).toBe("string");
  });

  it("redacts sensitive and content-bearing fields", () => {
    const buf = new BufferSink();
    setLogSink(buf);
    logger.error(
      { operation: "X", correlationId: "c", apiKey: "sk-secret", transcript: "private body", storageReference: "tenants/t/m", fileName: "a.mp3" },
      "boom",
    );
    const e = buf.lines[0]!;
    expect(e.apiKey).toBe("[REDACTED]");
    expect(e.transcript).toBe("[REDACTED]");
    expect(e.storageReference).toBe("[REDACTED]");
    expect(e.fileName).toBe("[REDACTED]");
  });

  it("contains no transcript or audio content in output", () => {
    const buf = new BufferSink();
    setLogSink(buf);
    logger.info({ operation: "T", correlationId: "c", content: "hidden transcript text" }, "ok");
    const serialized = JSON.stringify(buf.lines[0]);
    expect(serialized).not.toContain("hidden transcript text");
  });

  it("works without globalThis.process (simulated Worker runtime)", () => {
    const original = (globalThis as { process?: unknown }).process;
    // Simulate a Worker-style runtime where `process` is absent.
    (globalThis as { process?: unknown }).process = undefined;
    try {
      const buf = new BufferSink();
      setLogSink(buf);
      logger.warn({ operation: "W", correlationId: "c" }, "warn-msg");
      const w = buf.lines[0]!;
      expect(w.level).toBe("warn");
      expect(w.msg).toBe("warn-msg");
    } finally {
      (globalThis as { process?: unknown }).process = original;
    }
  });
});
