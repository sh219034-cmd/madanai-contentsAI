import type { GenerationUsage, StrategyAnalysis, StrategyCandidate } from "@/lib/types";
import type { StrategyAnalysisAiOutput } from "./strategy-schema";

/**
 * strategyAnalysisAiSchemaはrecommendationScoreを1〜5のnumberとして検証するが、
 * TypeScriptの型としては絞り込まれないため、ここで安全にリテラル型へ変換する。
 */
function toRecommendationScore(value: number): 1 | 2 | 3 | 4 | 5 {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return clamped as 1 | 2 | 3 | 4 | 5;
}

/**
 * AIの戦略候補出力を、ちょうど1件だけisRecommended=trueになるよう防御的に整える。
 * Structured Outputsのスキーマはフィールド形状のみを強制するため、
 * 「推奨は1件だけ」という業務ルールはここでアプリ側が保証する。
 */
function normalizeRecommendation(
  candidates: StrategyAnalysisAiOutput["candidates"],
): StrategyAnalysisAiOutput["candidates"] {
  const recommendedIndexes = candidates
    .map((c, index) => (c.isRecommended ? index : -1))
    .filter((index) => index !== -1);

  if (recommendedIndexes.length === 1) return candidates;

  // 0件 or 2件以上の場合は、おすすめ度が最も高い候補を1件だけ推奨にする
  const topIndex = candidates.reduce(
    (best, c, index) => (c.recommendationScore > candidates[best].recommendationScore ? index : best),
    0,
  );

  return candidates.map((c, index) => ({
    ...c,
    isRecommended: index === topIndex,
    recommendationReason: index === topIndex && !c.recommendationReason
      ? "他の候補と比較して、現在の入力内容に最も合致すると判断しました。"
      : index === topIndex
        ? c.recommendationReason
        : "",
  }));
}

/**
 * Claude APIの戦略分析出力から StrategyAnalysis を組み立てる。
 * id/createdAt/inputはアプリ側で付与する。
 */
export function buildStrategyAnalysisFromAi(
  id: string,
  input: StrategyAnalysis["input"],
  ai: StrategyAnalysisAiOutput,
  usage?: GenerationUsage,
): StrategyAnalysis {
  const normalized = normalizeRecommendation(ai.candidates);

  const candidates: StrategyCandidate[] = normalized.map((candidate, index) => ({
    ...candidate,
    id: `${id}-strategy-${index}`,
    recommendationScore: toRecommendationScore(candidate.recommendationScore),
    recommendationReason: candidate.isRecommended ? candidate.recommendationReason : undefined,
  }));

  return {
    id,
    createdAt: new Date().toISOString(),
    input,
    candidates,
    usage,
    isMock: false,
  };
}
