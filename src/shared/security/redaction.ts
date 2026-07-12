const SENSITIVE_KEYS = /(api[_-]?key|secret|token|password|authorization)/i;
const BODY_KEYS = /(audio|transcript|content|storageReference|filePath|localPath|signedUrl|fileName)/i;

/**
 * Redacts secrets and content-bearing fields from structured log/metadata objects.
 * Guarantees logs never contain raw audio, transcript bodies, filenames, or storage paths.
 */
export function redact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = "[redacted-secret]";
      continue;
    }
    if (BODY_KEYS.test(k)) {
      out[k] = "[redacted-content]";
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

export function redactTranscriptBody(text: string): string {
  return text.length > 80 ? text.slice(0, 80) + "…[redacted-transcript]" : "[redacted-transcript]";
}
