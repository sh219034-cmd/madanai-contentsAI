import type { PerformanceChannel, PerformanceContentType } from "./types";

/**
 * 媒体の表示名・選択肢一覧。UI（フォーム・カード・比較表）と
 * AI振り返りプロンプトの両方から、この1箇所だけを参照する。
 */
export const PERFORMANCE_CHANNEL_LABEL: Record<PerformanceChannel, string> = {
  threads: "Threads",
  "instagram-post": "Instagram投稿",
  "instagram-reel": "Instagramリール",
  line: "LINE配信",
  blog: "ブログ",
  lp: "LP",
  "pdf-offer": "PDF特典",
  website: "ホームページ",
  other: "その他",
};

export const PERFORMANCE_CHANNEL_OPTIONS: { value: PerformanceChannel; label: string }[] =
  (Object.keys(PERFORMANCE_CHANNEL_LABEL) as PerformanceChannel[]).map((value) => ({
    value,
    label: PERFORMANCE_CHANNEL_LABEL[value],
  }));

/** 媒体からコンテンツ種別への既定の対応（フォームで種別を別途入力させないための補助）。 */
export const CHANNEL_TO_CONTENT_TYPE: Record<PerformanceChannel, PerformanceContentType> = {
  threads: "sns",
  "instagram-post": "sns",
  "instagram-reel": "sns",
  line: "line",
  blog: "other",
  lp: "other",
  "pdf-offer": "pdf",
  website: "other",
  other: "other",
};
