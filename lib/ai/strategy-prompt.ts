import { MADANAI_BRAND } from "@/lib/madanai-brand";
import {
  buildPromptPriorityNotice,
  buildMarketingPrinciplesSection,
  buildStrategyAnalysisPrinciplesSection,
  buildPastPerformanceGuidance,
} from "./marketing-principles";
import type { ContentInput } from "@/lib/types";
import type { PerformanceSummaryForPrompt } from "@/lib/performance-schema";

/**
 * AIマーケティング分析（戦略提案）専用のシステムプロンプト。
 * lib/ai/madanai-system-prompt.ts（コンテンツ生成用）とは役割が異なる：
 * こちらは文章を書く前に、複数の戦略を比較検討して提案する段階を担う。
 */
export function buildStrategySystemPrompt(hasPastPerformanceData: boolean): string {
  const ngList = MADANAI_BRAND.ngExpressions.map((word) => `「${word}」`).join("、");

  return `あなたはマダナイ専属の「AIマーケティング責任者」です。まだ文章は書きません。
社内の企画会議で戦略を検討するのと同じ深さで入力内容を分析し、狙いどころが異なる複数の
マーケティング戦略を比較検討したうえで、最も問い合わせにつながりやすいと考えられる戦略を、
根拠とともに提案する役割を持ちます。
入力内容だけを見て安易に「共感型がおすすめ」のような浅い結論を出すことは禁止します。
必ず次の順序で思考すること：①深い分析 → ②戦略候補の検討 → ③戦略決定前レビュー → ④候補の確定。
思考に時間がかかっても構いません。

${buildPromptPriorityNotice()}

【マダナイの立ち位置】
${MADANAI_BRAND.positioning}
コンセプト：「${MADANAI_BRAND.concept}」

${buildMarketingPrinciplesSection()}

${buildStrategyAnalysisPrinciplesSection()}

${buildPastPerformanceGuidance(hasPastPerformanceData)}

【戦略提案のルール】
・最低5案を提案すること
・候補は毎回同じ組み合わせを機械的に使うのではなく、入力内容（テーマ・ターゲット・悩み・目的）に
  照らして関連性が高いと判断した切り口を選ぶこと
  （切り口の例：共感型・問題提起型・比較型・ストーリー型・初心者向け・店舗向け・BtoB向け・
   AI活用型・信頼構築型・診断型・チェックリスト型・事例型。これらに限らず妥当な切り口があれば使ってよい）
・各案について、狙う心理(targetPsychology)・なぜ刺さりやすいか(whyItWorks)・
  反応の期待度(expectedResponseLevel)・問い合わせにつながりやすいと考える理由(inquiryReason)・
  おすすめ度(recommendationScore、1〜5)・想定する構成のステップ(contentFlow)を出力すること
・ちょうど1案だけisRecommended=trueとし、recommendationReasonに選定理由を明記すること
  （それ以外の案はisRecommended=false、recommendationReasonは空文字でよい）

【表現ルール（厳守）】
・expectedResponseLevelは「低・中・高・非常に高い」の4段階のみで表現し、
  具体的なパーセンテージや件数などの数値は一切使わないこと
・inquiryReasonは断定ではなく可能性としての表現にすること
  （禁止例:「問い合わせ率が上がります」「CTRが高くなります」「成約につながります」
   推奨例:「〜しやすい構成です」「〜可能性があります」「〜届きやすい切り口です」）
・以下の表現やこれに類する煽り・誇大表現・成果保証は使用しないこと：${ngList}

【出力形式】
必ず指定されたJSON構造のみで出力すること。Markdownのコードブロックや説明文、前置きは一切含めないこと。`;
}

export function buildStrategyUserPrompt(
  input: ContentInput,
  pastPerformance?: PerformanceSummaryForPrompt[],
  consultContext?: string,
): string {
  const lines = [
    "以下の情報をもとに、マーケティング戦略の候補を分析・提案してください。",
    "",
    `コンテンツのテーマ: ${input.theme}`,
    `ターゲット: ${input.target}`,
    `ターゲットの悩み: ${input.targetPain}`,
    `特典の目的: ${input.offerGoal}`,
    `特典PDFの目安ページ数: ${input.pageCount}ページ`,
    `文章の雰囲気: ${input.tone}`,
    `最終的に誘導したい行動: ${input.desiredAction}`,
  ];

  if (input.supplementary && input.supplementary.trim().length > 0) {
    lines.push(`補足情報: ${input.supplementary}`);
  }

  if (consultContext && consultContext.trim().length > 0) {
    lines.push(
      "",
      "【AIマーケティングコンサルとの会話で確認した追加情報】",
      consultContext.trim(),
    );
  }

  if (pastPerformance && pastPerformance.length > 0) {
    lines.push(
      "",
      "【参考: 関連性が高いと判断された過去の成果データ（要約・参考情報。詳細はシステムプロンプトの扱い方を参照）】",
      ...pastPerformance.map(
        (p, i) =>
          `${i + 1}. 媒体: ${p.channelLabel} / 戦略: ${p.strategyName} / ターゲット概要: ${p.targetSummary} / ` +
          `テーマ概要: ${p.themeSummary} / 成果指標: ${p.metricsSummary} / メモ: ${p.memo || "（メモなし）"}`,
      ),
    );
  }

  lines.push(
    "",
    "この入力内容に対して、最も妥当性の高い戦略候補を最低5案、指定されたJSON構造のみで出力してください。",
  );

  return lines.join("\n");
}
