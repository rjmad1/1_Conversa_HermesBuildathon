import { logger } from "../logging/logger";

export interface SpanContext {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  attributes: Record<string, any>;
}

/**
 * Enterprise OpenTelemetry Distributed Tracing & APM Metrics Exporter
 */
export class OpenTelemetryService {
  private static activeSpans = new Map<string, SpanContext>();

  /**
   * Start a new OpenTelemetry distributed trace span
   */
  static startSpan(name: string, attributes: Record<string, any> = {}): SpanContext {
    const traceId = attributes.traceId || `trace-${Math.random().toString(36).substring(2, 11)}`;
    const spanId = `span-${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();

    const span: SpanContext = {
      traceId,
      spanId,
      name,
      startTime,
      attributes: {
        "service.name": "conversa-platform",
        "service.version": "0.3.0",
        ...attributes,
      },
    };

    this.activeSpans.set(spanId, span);
    logger.info({ traceId, spanId, spanName: name }, `[OpenTelemetry] Started span: ${name}`);
    return span;
  }

  /**
   * End an active OpenTelemetry span and record duration metrics
   */
  static endSpan(span: SpanContext, status: "OK" | "ERROR" = "OK", statusMessage?: string): number {
    const endTime = Date.now();
    const durationMs = endTime - span.startTime;

    this.activeSpans.delete(span.spanId);

    logger.info(
      {
        traceId: span.traceId,
        spanId: span.spanId,
        spanName: span.name,
        durationMs,
        status,
        statusMessage,
        attributes: span.attributes,
      },
      `[OpenTelemetry] Ended span: ${span.name} (${durationMs}ms)`
    );

    return durationMs;
  }

  /**
   * Record a dedicated LLM Inference Span for OpenTelemetry AI Observability
   */
  static recordLLMSpan(params: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    provider: string;
    tenantId: string;
  }): void {
    const totalTokens = params.promptTokens + params.completionTokens;
    logger.info(
      {
        "otel.kind": "llm_inference",
        "llm.provider": params.provider,
        "llm.model": params.model,
        "llm.usage.prompt_tokens": params.promptTokens,
        "llm.usage.completion_tokens": params.completionTokens,
        "llm.usage.total_tokens": totalTokens,
        "llm.latency_ms": params.latencyMs,
        "tenant.id": params.tenantId,
      },
      `[OpenTelemetry LLM Trace] Model ${params.model} processed ${totalTokens} tokens in ${params.latencyMs}ms`
    );
  }
}
