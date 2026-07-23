import type { PerformanceMetrics } from "./types";

export type PerformanceRates = {
  engagementRate?: number; // 反応率 = (いいね+コメント+保存+シェア) ÷ (リーチ or 表示回数)
  clickRate?: number; // クリック率 = リンククリック ÷ (リーチ or 表示回数)
  inquiryRate?: number; // 問い合わせ率 = 問い合わせ ÷ リンククリック
  conversionRate?: number; // 成約率 = 契約 ÷ 問い合わせ
};

/**
 * 分母が未入力または0の場合は計算せずundefinedを返す（実データが無いものを
 * 0として扱わないため）。分子が未入力の場合も同様にundefinedとする。
 */
function safeDivide(numerator: number | undefined, denominator: number | undefined): number | undefined {
  if (numerator === undefined || denominator === undefined) return undefined;
  if (denominator <= 0) return undefined;
  return numerator / denominator;
}

/**
 * いいね・コメント・保存・シェアのうち1つでも入力されていれば合算する。
 * すべて未入力の場合はundefined（「反応が0件だった」と「入力していない」を区別する）。
 */
function sumEngagement(metrics: PerformanceMetrics): number | undefined {
  const { likes, comments, saves, shares } = metrics;
  if (likes === undefined && comments === undefined && saves === undefined && shares === undefined) {
    return undefined;
  }
  return (likes ?? 0) + (comments ?? 0) + (saves ?? 0) + (shares ?? 0);
}

/**
 * 4つの自動計算指標。すべて「実データが揃っている場合のみ」計算し、
 * 成果を保証するものではない（あくまで参考値として画面に表示する）。
 */
export function calculatePerformanceRates(metrics: PerformanceMetrics): PerformanceRates {
  const reachOrImpressions = metrics.reach ?? metrics.impressions;
  return {
    engagementRate: safeDivide(sumEngagement(metrics), reachOrImpressions),
    clickRate: safeDivide(metrics.linkClicks, reachOrImpressions),
    inquiryRate: safeDivide(metrics.inquiries, metrics.linkClicks),
    conversionRate: safeDivide(metrics.contracts, metrics.inquiries),
  };
}

export function formatRatePercent(rate: number | undefined): string {
  if (rate === undefined) return "-";
  return `${(rate * 100).toFixed(1)}%`;
}
