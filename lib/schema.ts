import { z } from "zod";

/**
 * ContentInput のバリデーションスキーマ。
 * 入力フォーム（クライアント）と生成API（サーバー）の両方で共用する。
 */
export const contentInputSchema = z.object({
  theme: z
    .string()
    .min(1, "テーマを入力してください")
    .max(120, "120文字以内で入力してください"),
  target: z
    .string()
    .min(1, "ターゲットを入力してください")
    .max(120, "120文字以内で入力してください"),
  targetPain: z
    .string()
    .min(1, "ターゲットの悩みを入力してください")
    .max(400, "400文字以内で入力してください"),
  offerGoal: z
    .string()
    .min(1, "特典の目的を入力してください")
    .max(200, "200文字以内で入力してください"),
  pageCount: z
    .number({ error: "ページ数を入力してください" })
    .int("整数で入力してください")
    .min(3, "3ページ以上で入力してください")
    .max(20, "20ページ以内で入力してください"),
  tone: z.string().min(1, "文章の雰囲気を選択してください"),
  desiredAction: z
    .string()
    .min(1, "誘導したい行動を入力してください")
    .max(200, "200文字以内で入力してください"),
  supplementary: z
    .string()
    .max(1000, "1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

export type ContentInputFormValues = z.infer<typeof contentInputSchema>;

/**
 * クライアントが選択済みの戦略候補(StrategyCandidate)を /api/generate へ送る際の
 * バリデーションスキーマ。値はこのアプリ自身が/api/strategyまたは固定モックで
 * 発行したものだが、ネットワークをまたぐため構造だけは検証する。
 */
export const strategyCandidateSchema = z.object({
  id: z.string().min(1),
  angle: z.enum([
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
  ]),
  name: z.string().min(1).max(60),
  targetPsychology: z.string().min(1).max(400),
  whyItWorks: z.string().min(1).max(400),
  expectedResponseLevel: z.enum(["低", "中", "高", "非常に高い"]),
  inquiryReason: z.string().min(1).max(400),
  recommendationScore: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  contentFlow: z.array(z.string().max(60)).min(1).max(10),
  isRecommended: z.boolean(),
  recommendationReason: z.string().max(400).optional(),
});

export const generateRequestSchema = z.object({
  input: contentInputSchema,
  strategy: strategyCandidateSchema,
});
