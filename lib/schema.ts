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
