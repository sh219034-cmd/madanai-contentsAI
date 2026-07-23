import { z } from "zod";

/**
 * AI振り返り(POST /api/performance-review)の出力スキーマ。
 * 成果を保証する表現や断定的な因果関係の記述を防ぐため、各項目は
 * 「可能性」としての短文リストにとどめる（プロンプト側でも明示する）。
 */
export const performanceReviewAiSchema = z.object({
  goodFactors: z
    .array(z.string().max(200))
    .min(1)
    .max(8), // 良かった可能性がある要因
  improvementPoints: z
    .array(z.string().max(200))
    .min(1)
    .max(8), // 改善できる点
  nextStrategiesToTry: z
    .array(z.string().max(200))
    .min(1)
    .max(8), // 次回試すべき戦略
  thingsToContinue: z
    .array(z.string().max(200))
    .min(1)
    .max(8), // 継続すべき要素
  thingsToChange: z
    .array(z.string().max(200))
    .min(1)
    .max(8), // 変えるべき要素
});

export type PerformanceReviewAiOutput = z.infer<typeof performanceReviewAiSchema>;
