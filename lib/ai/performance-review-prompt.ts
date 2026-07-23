import { buildPromptPriorityNotice, buildMarketingPrinciplesSection } from "./marketing-principles";
import { PERFORMANCE_CHANNEL_LABEL } from "@/lib/performance-labels";
import { calculatePerformanceRates, formatRatePercent } from "@/lib/performance-metrics";
import type { PerformanceRecord } from "@/lib/types";

/**
 * AI振り返り専用のシステムプロンプト。成果データ1件のみを対象とし、
 * 戦略分析・コンテンツ生成とは異なり「今後に活かす振り返り」に役割を限定する。
 */
export function buildPerformanceReviewSystemPrompt(): string {
  return `あなたはマダナイ専属の「AIマーケティング責任者」です。
既に公開・計測済みの成果データ1件をもとに、次回以降に活かすための振り返りを行います。
これは成果を保証したり、実績データから因果関係を断定したりする場ではありません。

${buildPromptPriorityNotice()}

【必ず守ること】
・実績データから因果関係を断定しない。すべて「〜だった可能性があります」「〜と考えられます」等、
  可能性としての表現にとどめること
・入力された指標だけを根拠にし、母数が小さい、または指標の一部しか無い場合は
  「件数が少ないため参考程度」である旨を踏まえたうえで慎重に述べること
・存在しない数値や実績を補完しない。入力に無い情報は使わないこと
・断定的な成果保証をする表現は使わないこと（「必ず伸びます」「成功します」等は禁止）

${buildMarketingPrinciplesSection()}

【出力形式】
必ず指定されたJSON構造のみで出力すること。Markdownのコードブロックや説明文、前置きは一切含めないこと。`;
}

function formatMetricsLines(record: PerformanceRecord): string[] {
  const { metrics } = record;
  const rates = calculatePerformanceRates(metrics);
  const lines: string[] = [];
  const push = (label: string, value: number | undefined, unit = "") => {
    if (value !== undefined) lines.push(`${label}: ${value}${unit}`);
  };
  push("表示回数", metrics.impressions);
  push("リーチ", metrics.reach);
  push("閲覧数", metrics.views);
  push("いいね", metrics.likes);
  push("コメント", metrics.comments);
  push("保存", metrics.saves);
  push("シェア", metrics.shares);
  push("プロフィールアクセス", metrics.profileVisits);
  push("リンククリック", metrics.linkClicks);
  push("LINE登録", metrics.lineAdds);
  push("フォーム送信", metrics.formSubmissions);
  push("問い合わせ", metrics.inquiries, "件");
  push("契約", metrics.contracts, "件");
  push("売上", metrics.revenue, "円");
  if (rates.engagementRate !== undefined) lines.push(`反応率（自動計算）: ${formatRatePercent(rates.engagementRate)}`);
  if (rates.clickRate !== undefined) lines.push(`クリック率（自動計算）: ${formatRatePercent(rates.clickRate)}`);
  if (rates.inquiryRate !== undefined) lines.push(`問い合わせ率（自動計算）: ${formatRatePercent(rates.inquiryRate)}`);
  if (rates.conversionRate !== undefined) lines.push(`成約率（自動計算）: ${formatRatePercent(rates.conversionRate)}`);
  return lines.length > 0 ? lines : ["記録されている成果指標がありません"];
}

export function buildPerformanceReviewUserPrompt(record: PerformanceRecord): string {
  const lines = [
    "以下の1件の成果データについて、次の5項目を分析してください。",
    "・良かった可能性がある要因　・改善できる点　・次回試すべき戦略　・継続すべき要素　・変えるべき要素",
    "",
    `媒体: ${PERFORMANCE_CHANNEL_LABEL[record.channel]}`,
    `戦略: ${record.strategyName || "不明"}`,
    `ターゲット: ${record.target || "不明"}`,
    `コンテンツ名: ${record.title}`,
    `公開日: ${record.publishedAt}`,
    `計測期間: ${record.measurementPeriod || "不明"}`,
    "",
    "【成果指標】",
    ...formatMetricsLines(record),
    "",
    "【メモ】",
    record.notes || "（メモなし）",
  ];
  return lines.join("\n");
}
