/**
 * モデルごとの価格（USD / 100万トークン）を1か所で管理する。
 * 価格が変わった場合はこのファイルだけを更新すればよい。
 *
 * 参照: https://platform.claude.com/docs/en/about-claude/pricing
 * および https://platform.claude.com/docs/en/about-claude/models/overview
 * （確認日: 2026-07-19）
 *
 * 注: claude-sonnet-5 は 2026-08-31 まで導入価格（$2 / $10）が適用される
 * 場合があるが、期限付きのため恒久価格（$3 / $15）を既定値としている。
 */
export const MODEL_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

/**
 * 概算費用（USD）を計算する。価格情報が無いモデルの場合はnullを返す。
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const pricing = MODEL_PRICING_PER_MTOK[model];
  if (!pricing) return null;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}
