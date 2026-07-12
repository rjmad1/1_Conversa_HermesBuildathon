import { redact } from "../security/redaction";

export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  operation?: string;
  correlationId?: string;
  durationMs?: number;
  outcome?: "success" | "failure";
  errorCode?: string;
  [k: string]: unknown;
}

export interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  [k: string]: unknown;
}

export interface LogSink {
  write(entry: LogEntry): void;
}

/** Default sink: console, available in Node and Worker runtimes. */
class ConsoleSink implements LogSink {
  write(entry: LogEntry): void {
    const line = JSON.stringify(entry);
    if (entry.level === "error") console.error(line);
    else if (entry.level === "warn") console.warn(line);
    else console.log(line);
  }
}

export interface Logger {
  info(ctx: LogContext, msg: string): void;
  warn(ctx: LogContext, msg: string): void;
  error(ctx: LogContext, msg: string): void;
}

class AppLogger implements Logger {
  private sink: LogSink = new ConsoleSink();
  setSink(sink: LogSink): void {
    this.sink = sink;
  }
  private emit(level: LogLevel, ctx: LogContext, msg: string): void {
    const entry: LogEntry = { ts: new Date().toISOString(), level, msg, ...redact(ctx) };
    this.sink.write(entry);
  }
  info(ctx: LogContext, msg: string): void {
    this.emit("info", ctx, msg);
  }
  warn(ctx: LogContext, msg: string): void {
    this.emit("warn", ctx, msg);
  }
  error(ctx: LogContext, msg: string): void {
    this.emit("error", ctx, msg);
  }
}

export const logger = new AppLogger();

export function setLogSink(sink: LogSink | null): void {
  logger.setSink(sink ?? new ConsoleSink());
}
