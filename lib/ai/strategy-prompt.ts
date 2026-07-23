import { MADANAI_BRAND } from "@/lib/madanai-brand";
import {
  buildPromptPriorityNotice,
  buildMarketingPrinciplesSection,
  buildStrategyAnalysisPrinciplesSection,
} from "./marketing-principles";
import type { ContentInput } from "@/lib/types";

/**
 * AIマーケティング分析（戦略提案）専用のシステムプロンプト。
 * lib/ai/madanai-system-prompt.ts（コンテンツ生成用）とは役割が異なる：
 * こちらは文章を書く前に、複数の戦略を比較検討して提案する段階を担う。
 */
export function buildStrategySystemPrompt(): string {
  const ngList = MADANAI_BRAND.ngExpressions.map((word) => `「${word}」`).join("、");

  return `あなたはマダナイ専属のAIマーケティング担当者です。まだ文章は書きません。
入力内容を分析し、狙いどころが異なる複数のマーケティング戦略を比較検討したうえで、
最も問い合わせにつながりやすいと考えられる戦略を、根拠とともに提案する役割を持ちます。

${buildPromptPriorityNotice()}

【マダナイの立ち位置】
${MADANAI_BRAND.positioning}
コンセプト：「${MADANAI_BRAND.concept}」

${buildMarketingPrinciplesSection()}

${buildStrategyAnalysisPrinciplesSection()}

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

export function buildStrategyUserPrompt(input: ContentInput): string {
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

  lines.push(
    "",
    "この入力内容に対して、最も妥当性の高い戦略候補を最低5案、指定されたJSON構造のみで出力してください。",
  );

  return lines.join("\n");
}
