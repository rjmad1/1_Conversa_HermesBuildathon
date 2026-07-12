const SENSITIVE_PATTERN = /^(authorization|cookie|set[_-]?cookie|api[_-]?key|secret|token|accessToken|access[_-]?token|refreshToken|refresh[_-]?token|password|transcript|audio|audioBytes|rawAudio|content|storageReference|filePath|localPath|signedUrl|fileName)$/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERN.test(key);
}

/**
 * Recursively redacts sensitive keys from objects, arrays, and error structures.
 * Prevents cyclic infinite recursion using a WeakSet, limits depth to 10,
 * and preserves non-sensitive metadata without mutating the input object.
 */
export function redact<T>(obj: T): T {
  const seen = new WeakSet<any>();
  const MAX_DEPTH = 10;

  function recurse(val: unknown, depth: number): unknown {
    if (depth > MAX_DEPTH) {
      return "[MAX_DEPTH_REACHED]";
    }
    if (val === null || val === undefined) {
      return val;
    }
    if (typeof val !== "object") {
      return val;
    }

    // Handle cyclic structures
    if (seen.has(val)) {
      return "[CIRCULAR]";
    }
    seen.add(val);

    // Handle Arrays
    if (Array.isArray(val)) {
      const copy = val.map((item) => recurse(item, depth + 1));
      seen.delete(val);
      return copy;
    }

    // Handle Dates
    if (val instanceof Date) {
      seen.delete(val);
      return val;
    }

    // Handle Objects and Errors
    const out: Record<string, unknown> = {};
    let keys: string[] = [];

    if (val instanceof Error) {
      keys = ["name", "message", "stack", ...Object.keys(val)];
    } else {
      keys = Object.keys(val);
    }

    for (const k of keys) {
      const v = (val as Record<string, unknown>)[k];
      if (isSensitiveKey(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = recurse(v, depth + 1);
      }
    }

    seen.delete(val);
    return out;
  }

  return recurse(obj, 0) as T;
}

export function redactTranscriptBody(text: string): string {
  return text.length > 80 ? text.slice(0, 80) + "…[REDACTED]" : "[REDACTED]";
}
