import { z } from "zod";

/**
 * 数値入力欄はHTML input(type=number/text)からの文字列として受け取る。
 * 空欄は許可する（未入力=データなし、0=実際に0件、を区別するため0で補完しない）。
 * フォーム上のバリデーションは文字列のまま行い（z.preprocessでunknownの
 * 入力型になるとreact-hook-formの型推論と噛み合わないため）、数値への変換は
 * 保存直前（PerformanceRecordFormModalのonSubmit）で行う。
 */
function optionalNonNegativeNumberString(label: string, integerOnly: boolean) {
  return z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val.trim() === "") return true;
        const num = Number(val.trim());
        if (Number.isNaN(num)) return false;
        if (integerOnly && !Number.isInteger(num)) return false;
        return num >= 0;
      },
      {
        message: integerOnly
          ? `${label}は0以上の整数で入力してください`
          : `${label}は0以上の数値で入力してください`,
      },
    );
}

function optionalNonNegativeInt(label: string) {
  return optionalNonNegativeNumberString(label, true);
}

function optionalNonNegativeNumber(label: string) {
  return optionalNonNegativeNumberString(label, false);
}

/** 成果登録フォーム(RHF)用。数値は文字列のまま持ち、保存時に変換する。 */
export const performanceMetricsFormSchema = z.object({
  impressions: optionalNonNegativeInt("表示回数"),
  reach: optionalNonNegativeInt("リーチ"),
  views: optionalNonNegativeInt("閲覧数"),
  likes: optionalNonNegativeInt("いいね"),
  comments: optionalNonNegativeInt("コメント"),
  saves: optionalNonNegativeInt("保存"),
  shares: optionalNonNegativeInt("シェア"),
  profileVisits: optionalNonNegativeInt("プロフィールアクセス"),
  linkClicks: optionalNonNegativeInt("リンククリック"),
  lineAdds: optionalNonNegativeInt("LINE登録"),
  formSubmissions: optionalNonNegativeInt("フォーム送信"),
  inquiries: optionalNonNegativeInt("問い合わせ"),
  contracts: optionalNonNegativeInt("契約"),
  revenue: optionalNonNegativeNumber("売上"),
});

function optionalNonNegativeIntNumber(label: string) {
  return z
    .number({ error: `${label}は数値で入力してください` })
    .int(`${label}は整数で入力してください`)
    .min(0, `${label}は0以上で入力してください`)
    .optional();
}

function optionalNonNegativeRealNumber(label: string) {
  return z
    .number({ error: `${label}は数値で入力してください` })
    .min(0, `${label}は0以上で入力してください`)
    .optional();
}

/** 保存済み成果記録(PerformanceRecord.metrics)用。数値そのものを検証する。 */
export const performanceMetricsSchema = z.object({
  impressions: optionalNonNegativeIntNumber("表示回数"),
  reach: optionalNonNegativeIntNumber("リーチ"),
  views: optionalNonNegativeIntNumber("閲覧数"),
  likes: optionalNonNegativeIntNumber("いいね"),
  comments: optionalNonNegativeIntNumber("コメント"),
  saves: optionalNonNegativeIntNumber("保存"),
  shares: optionalNonNegativeIntNumber("シェア"),
  profileVisits: optionalNonNegativeIntNumber("プロフィールアクセス"),
  linkClicks: optionalNonNegativeIntNumber("リンククリック"),
  lineAdds: optionalNonNegativeIntNumber("LINE登録"),
  formSubmissions: optionalNonNegativeIntNumber("フォーム送信"),
  inquiries: optionalNonNegativeIntNumber("問い合わせ"),
  contracts: optionalNonNegativeIntNumber("契約"),
  revenue: optionalNonNegativeRealNumber("売上"),
});

/**
 * 成果登録フォーム(PerformanceRecordFormModal)のバリデーションスキーマ。
 * id/contentId/contentType/createdAt/updatedAtはフォームでは扱わず、
 * 保存時にlib/performance-storage.ts側で付与する。
 */
export const performanceRecordFormSchema = z.object({
  channel: z.enum([
    "threads",
    "instagram-post",
    "instagram-reel",
    "line",
    "blog",
    "lp",
    "pdf-offer",
    "website",
    "other",
  ]),
  publishedAt: z.string().min(1, "公開日を入力してください"),
  measurementPeriod: z.string().max(60, "60文字以内で入力してください").optional().or(z.literal("")),
  title: z.string().min(1, "コンテンツ名を入力してください").max(120, "120文字以内で入力してください"),
  target: z.string().max(200, "200文字以内で入力してください").optional().or(z.literal("")),
  strategyName: z.string().max(60, "60文字以内で入力してください").optional().or(z.literal("")),
  notes: z.string().max(1000, "1000文字以内で入力してください").optional().or(z.literal("")),
  metrics: performanceMetricsFormSchema,
});

export type PerformanceRecordFormValues = z.infer<typeof performanceRecordFormSchema>;

/**
 * 過去の成果を戦略分析プロンプトへ渡す際の要約サブセット
 * （lib/performance-relevance.ts が組み立てる）。raw contentやメモ全文・
 * 個人情報は含めない。/api/strategy のリクエストボディ検証にも使う。
 */
export const performanceSummarySchema = z.object({
  channelLabel: z.string().max(40),
  strategyName: z.string().max(60),
  targetSummary: z.string().max(200),
  themeSummary: z.string().max(200),
  metricsSummary: z.string().max(300),
  memo: z.string().max(200),
});

export type PerformanceSummaryForPrompt = z.infer<typeof performanceSummarySchema>;

/**
 * /api/performance-review のリクエストボディ検証用。PerformanceRecord全体を
 * そのまま送るため、型と対応する構造だけを検証する（AI振り返りはこの1件のみを
 * 参照し、他の記録や個人情報は送らない）。
 */
export const performanceRecordSchema = z.object({
  id: z.string().min(1),
  contentId: z.string().min(1),
  contentType: z.enum(["pdf", "line", "sns", "other"]),
  channel: z.enum([
    "threads",
    "instagram-post",
    "instagram-reel",
    "line",
    "blog",
    "lp",
    "pdf-offer",
    "website",
    "other",
  ]),
  publishedAt: z.string().min(1),
  measurementPeriod: z.string(),
  strategyName: z.string(),
  target: z.string(),
  title: z.string().min(1),
  notes: z.string(),
  metrics: performanceMetricsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
