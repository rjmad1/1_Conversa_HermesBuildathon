/**
 * Deterministic Canonical Serializer for Knowledge Publishing.
 * Sorts object keys recursively, normalizes strings (Unicode NFC),
 * and strips volatile/ephemeral fields when requested.
 */
export class CanonicalSerializer {
  public static serialize(obj: unknown, options?: { excludeVolatileFields?: boolean }): string {
    const prepared = this.prepareValue(obj, options?.excludeVolatileFields ?? false);
    return JSON.stringify(prepared);
  }

  private static prepareValue(val: unknown, excludeVolatile: boolean): unknown {
    if (val === null || val === undefined) {
      return null;
    }

    if (typeof val === "string") {
      return val.normalize("NFC");
    }

    if (typeof val === "number") {
      // Normalize float representation if integer or clean decimal
      return Number.isFinite(val) ? Number(val.toFixed(6).replace(/\.?0+$/, "")) : val;
    }

    if (typeof val === "boolean") {
      return val;
    }

    if (Array.isArray(val)) {
      return val.map((item) => this.prepareValue(item, excludeVolatile));
    }

    if (typeof val === "object") {
      const sortedObj: Record<string, unknown> = {};
      const keys = Object.keys(val as Record<string, unknown>).sort();

      for (const key of keys) {
        if (excludeVolatile && (key === "generatedAt" || key === "publicationId" || key === "renderedAt")) {
          continue;
        }
        const propValue = (val as Record<string, unknown>)[key];
        if (propValue !== undefined) {
          sortedObj[key] = this.prepareValue(propValue, excludeVolatile);
        }
      }

      return sortedObj;
    }

    return String(val);
  }
}
