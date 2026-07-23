import type { ContentInput, PerformanceRecord } from "./types";
import { PERFORMANCE_CHANNEL_LABEL } from "./performance-labels";
import { calculatePerformanceRates, formatRatePercent } from "./performance-metrics";
import type { PerformanceSummaryForPrompt } from "./performance-schema";

/**
 * 日本語には単語区切りが無く、形態素解析ライブラリも導入していないため、
 * 文字2-gram(bigram)のJaccard類似度で簡易的な近さを測る。
 * 完全一致でなくても「似たテーマ・似たターゲット」を緩く拾うのが目的で、
 * 厳密な意味理解を目指すものではない。
 */
function bigrams(text: string): Set<string> {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 2) return new Set(normalized ? [normalized] : []);
  const set = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    set.add(normalized.slice(i, i + 2));
  }
  return set;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const gram of setA) {
    if (setB.has(gram)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 入力内容(ContentInput)に近いと判断した過去の成果記録を、最大limit件まで返す。
 * 戦略分析の段階ではまだ媒体・戦略が決まっていないため、ここでは
 * ターゲット・テーマ・悩みのテキスト類似度のみでスコアリングする
 * （媒体・戦略タイプでの絞り込みは/performance画面の比較機能側で行う）。
 * スコアが0（まったく似ていない）の記録は候補に含めない。
 */
export function findRelevantPerformanceRecords(
  input: ContentInput,
  records: PerformanceRecord[],
  limit = 5,
): PerformanceRecord[] {
  return records
    .map((record) => {
      const targetScore = jaccardSimilarity(input.target, record.target);
      const themeScore = jaccardSimilarity(input.theme, record.title);
      const painScore = jaccardSimilarity(input.targetPain, record.notes);
      const score = targetScore * 0.5 + themeScore * 0.35 + painScore * 0.15;
      return { record, score };
    })
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => scored.record);
}

/**
 * 成果指標を人が読める短い日本語文へ要約する。実数値のうち売上のみは
 * 「記録あり」とだけ伝え、具体的な金額は外部（Claude API）へ送らない
 * （売上・顧客情報を安易に外部へ渡さないための保守的な判断）。
 */
function summarizeMetrics(record: PerformanceRecord): string {
  const rates = calculatePerformanceRates(record.metrics);
  const parts: string[] = [];
  if (rates.engagementRate !== undefined) parts.push(`反応率 ${formatRatePercent(rates.engagementRate)}`);
  if (rates.clickRate !== undefined) parts.push(`クリック率 ${formatRatePercent(rates.clickRate)}`);
  if (record.metrics.inquiries !== undefined) parts.push(`問い合わせ ${record.metrics.inquiries}件`);
  if (rates.inquiryRate !== undefined) parts.push(`問い合わせ率 ${formatRatePercent(rates.inquiryRate)}`);
  if (record.metrics.contracts !== undefined) parts.push(`契約 ${record.metrics.contracts}件`);
  if (rates.conversionRate !== undefined) parts.push(`成約率 ${formatRatePercent(rates.conversionRate)}`);
  if (record.metrics.revenue !== undefined) parts.push("売上の記録あり");
  return parts.length > 0 ? parts.join("、") : "成果指標の記録が少ない";
}

/**
 * 戦略分析プロンプトへ渡す要約サブセットを組み立てる。raw contentや
 * メモ全文・個人情報は含めず、成果指標も上記summarizeMetricsで丸めた
 * 文字列のみを渡す（performanceSummarySchemaで長さも制限する）。
 */
export function buildPerformanceSummaryForPrompt(
  records: PerformanceRecord[],
): PerformanceSummaryForPrompt[] {
  return records.map((record) => ({
    channelLabel: PERFORMANCE_CHANNEL_LABEL[record.channel],
    strategyName: record.strategyName || "不明",
    targetSummary: record.target.slice(0, 200) || "不明",
    themeSummary: record.title.slice(0, 200) || "不明",
    metricsSummary: summarizeMetrics(record),
    memo: record.notes.slice(0, 200),
  }));
}
