import { z } from "zod";

/**
 * AIマーケティング分析（戦略提案）のStructured Outputsスキーマ。
 * 想定CTRのような具体的な数値は使わず、4段階の相対評価にとどめる
 * （マダナイのブランドルール：根拠のない数字・成果保証の禁止）。
 */

export const strategyAngleSchema = z.enum([
  "empathy",
  "problem",
  "comparison",
  "story",
  "beginner",
  "store",
  "b2b",
  "ai-driven",
  "trust",
  "diagnosis",
  "checklist",
  "case-study",
  "other",
]);

export const expectedResponseLevelSchema = z.enum(["低", "中", "高", "非常に高い"]);

export const strategyCandidateAiSchema = z.object({
  angle: strategyAngleSchema,
  name: z.string(),
  targetPsychology: z.string(),
  whyItWorks: z.string(),
  expectedResponseLevel: expectedResponseLevelSchema,
  inquiryReason: z.string(),
  recommendationScore: z.number().int().min(1).max(5),
  // 想定する構成のステップ（例:["共感","問題の原因","チェックリスト","自己診断","無料相談"]）
  contentFlow: z.array(z.string()).min(3).max(8),
  isRecommended: z.boolean(),
  // isRecommended=falseの場合は空文字でよい（アプリ側で無視する）
  recommendationReason: z.string(),
});

export const strategyAnalysisAiSchema = z.object({
  candidates: z.array(strategyCandidateAiSchema).min(5).max(9),
});

export type StrategyCandidateAiOutput = z.infer<typeof strategyCandidateAiSchema>;
export type StrategyAnalysisAiOutput = z.infer<typeof strategyAnalysisAiSchema>;
