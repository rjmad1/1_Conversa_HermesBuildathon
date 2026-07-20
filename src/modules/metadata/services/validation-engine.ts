import { z, ZodSchema } from "zod";
import type {
  ResolvedObjectTypeSchema,
  FieldDefinition,
  ValidationResult,
  ValidationError,
} from "../domain/types";

export class ValidationEngine {
  private zodCache = new Map<string, ZodSchema>(); // `${typeId}_v${effectiveVersion}` -> ZodSchema

  /**
   * Layer 1: Compiles a ResolvedObjectTypeSchema into a dynamic Zod Schema.
   */
  compileZodSchema(schema: ResolvedObjectTypeSchema): ZodSchema {
    const cacheKey = `${schema.typeId}_v${schema.effectiveVersion}`;
    if (this.zodCache.has(cacheKey)) {
      return this.zodCache.get(cacheKey)!;
    }

    const shape: Record<string, ZodSchema> = {};

    for (const [key, field] of schema.fields.entries()) {
      shape[key] = this.compileFieldSchema(field);
    }

    const zodSchema = z.object(shape).passthrough();
    this.zodCache.set(cacheKey, zodSchema);
    return zodSchema;
  }

  /**
   * Compiles an individual FieldDefinition into its corresponding Zod validation schema.
   */
  private compileFieldSchema(field: FieldDefinition): ZodSchema {
    let base: z.ZodTypeAny;

    switch (field.type) {
      case "Number":
      case "Currency":
        let numSchema = z.number();
        if (field.constraints?.min !== undefined) numSchema = numSchema.min(field.constraints.min);
        if (field.constraints?.max !== undefined) numSchema = numSchema.max(field.constraints.max);
        base = numSchema;
        break;

      case "Boolean":
        base = z.boolean();
        break;

      case "Date":
      case "DateTime":
        base = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format string",
        });
        break;

      case "Email":
        base = z.string().email();
        break;

      case "URL":
        base = z.string().url();
        break;

      case "Select":
        if (field.constraints?.options && field.constraints.options.length > 0) {
          base = z.enum(field.constraints.options as [string, ...string[]]);
        } else {
          base = z.string();
        }
        break;

      case "MultiSelect":
      case "Tag":
        base = z.array(z.string());
        break;

      case "JSON":
      case "AIGenerated":
      case "Computed":
      case "Rollup":
      case "Formula":
        base = z.any();
        break;

      case "Reference":
      case "RichText":
      case "Text":
      case "Phone":
      default:
        let strSchema = z.string();
        if (field.constraints?.min !== undefined) strSchema = strSchema.min(field.constraints.min);
        if (field.constraints?.max !== undefined) strSchema = strSchema.max(field.constraints.max);
        if (field.constraints?.regex) {
          try {
            strSchema = strSchema.regex(new RegExp(field.constraints.regex));
          } catch (e) {
            // Ignore invalid regex in user constraints
          }
        }
        base = strSchema;
        break;
    }

    if (!field.required) {
      base = base.optional().nullable();
    }

    return base;
  }

  /**
   * Executes the 4-Layer Validation Pipeline against an object's properties payload.
   */
  async validate(
    schema: ResolvedObjectTypeSchema,
    properties: Record<string, any>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Layer 1: Structural Zod Schema Check
    const zodSchema = this.compileZodSchema(schema);
    const parsed = zodSchema.safeParse(properties);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const fieldKey = issue.path.join(".");
        errors.push({
          fieldKey,
          code: "INVALID_FIELD_VALUE",
          message: `${fieldKey ? `[${fieldKey}] ` : ""}${issue.message}`,
          severity: "error",
        });
      }
    }

    // Layer 2: Metadata & Custom Constraint Validation
    for (const [key, field] of schema.fields.entries()) {
      const value = properties[key];

      // Required check fallback
      if (field.required && (value === undefined || value === null || value === "")) {
        if (!errors.some((e) => e.fieldKey === key && e.code === "REQUIRED_FIELD_MISSING")) {
          errors.push({
            fieldKey: key,
            code: "REQUIRED_FIELD_MISSING",
            message: `Field '${field.name}' (${key}) is required.`,
            severity: "error",
          });
        }
      }
    }

    // Layer 3: Workspace & Graph Integrity (Hook point for reference checking)
    // Layer 4: Extension Pipeline / AegisOS Plugins (Hook point for policy checks)

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
