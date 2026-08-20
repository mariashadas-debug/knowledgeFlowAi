interface ModelPrice {
  inputPerMillion: number;
  outputPerMillion: number;
}

const MODEL_PRICES_USD: Record<string, ModelPrice> = {
  'gpt-4.1-mini': { inputPerMillion: 0.4, outputPerMillion: 1.6 },
};

export function estimateCost(
  model: string,
  promptTokens: number | null,
  completionTokens: number | null,
): number | null {
  const price = MODEL_PRICES_USD[model];
  if (!price || promptTokens === null || completionTokens === null) return null;
  return (
    (promptTokens * price.inputPerMillion + completionTokens * price.outputPerMillion) / 1_000_000
  );
}
