export interface ModelRate {
  inputPerThousand: number;
  outputPerThousand: number;
}

export const PRICING_TABLE: Record<string, Record<string, ModelRate>> = {
  openai: {
    "gpt-4o": { inputPerThousand: 0.005, outputPerThousand: 0.015 },
    "gpt-4o-mini": { inputPerThousand: 0.00015, outputPerThousand: 0.0006 },
    "default": { inputPerThousand: 0.0015, outputPerThousand: 0.002 },
  },
  fake: {
    "fake": { inputPerThousand: 0.0, outputPerThousand: 0.0 },
    "default": { inputPerThousand: 0.0, outputPerThousand: 0.0 },
  },
};

export function estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  if (provider === "fake") return 0.0;
  const rates = PRICING_TABLE[provider] || PRICING_TABLE["openai"];
  if (!rates) return 0.0;
  const modelRates = rates[model] || rates["default"];
  if (!modelRates) return 0.0;
  return (inputTokens / 1000) * modelRates.inputPerThousand + (outputTokens / 1000) * modelRates.outputPerThousand;
}
