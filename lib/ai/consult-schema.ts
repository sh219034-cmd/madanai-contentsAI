import { z } from "zod";

/**
 * AIマーケティングコンサルモード(POST /api/consult)のStructured Outputsスキーマ。
 * summaryは毎回必須にし（十分でない段階でも現時点の理解として埋める）、
 * isSufficient/questionsとの組み合わせをアプリ側(lib/ai/build-consult.ts)で
 * 解釈する。こうすることで「isSufficientなのにsummaryが欠けている」等の
 * 分岐をStructured Outputsのスキーマ自体に持たせずに済む。
 */
export const consultQuestionAiSchema = z.object({
  question: z.string(),
  reason: z.string(), // なぜこの質問をするのか（ユーザーへそのまま表示する）
});

export const consultSummaryAiSchema = z.object({
  target: z.string(),
  usp: z.string(),
  benefit: z.string(),
  evidence: z.string(),
  purpose: z.string(),
  cta: z.string(),
});

export const consultAiSchema = z.object({
  isSufficient: z.boolean(),
  // 0〜3問。isSufficient=trueの場合は空配列でよい
  questions: z.array(consultQuestionAiSchema).max(3),
  summary: consultSummaryAiSchema,
});

export type ConsultAiOutput = z.infer<typeof consultAiSchema>;
