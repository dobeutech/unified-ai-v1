/**
 * Rough USD per 1M tokens for dashboard estimates only — not billing truth.
 * Adjust via env or edit as your gateway pricing changes.
 */
const DEFAULT_INPUT_PER_M = 0.15;
const DEFAULT_OUTPUT_PER_M = 0.6;

export function estimateCostUsd(
  modelId: string,
  promptTokens: number | undefined,
  completionTokens: number | undefined,
): string | null {
  const inRate = Number(process.env.COST_INPUT_PER_M_TOKENS_USD ?? DEFAULT_INPUT_PER_M);
  const outRate = Number(process.env.COST_OUTPUT_PER_M_TOKENS_USD ?? DEFAULT_OUTPUT_PER_M);
  if (!Number.isFinite(inRate) || !Number.isFinite(outRate)) return null;
  const p = promptTokens ?? 0;
  const c = completionTokens ?? 0;
  const usd = (p / 1_000_000) * inRate + (c / 1_000_000) * outRate;
  if (usd === 0 && p === 0 && c === 0) return null;
  return usd.toFixed(6);
}

export function modelPricingNote(modelId: string): string {
  return `model=${modelId}; rates from COST_* env or defaults`;
}
