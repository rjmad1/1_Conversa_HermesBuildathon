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

export interface Logger {
  info(ctx: LogContext, msg: string): void;
  warn(ctx: LogContext, msg: string): void;
  error(ctx: LogContext, msg: string): void;
}

class ConsoleLogger implements Logger {
  private emit(level: LogLevel, ctx: LogContext, msg: string): void {
    const entry = { ts: new Date().toISOString(), level, msg, ...redact(ctx) };
    process.stdout.write(JSON.stringify(entry) + "\n");
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

export const logger: Logger = new ConsoleLogger();
