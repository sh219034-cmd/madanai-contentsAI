import type { ConsultQaItem, ConsultSummary } from "./types";

/**
 * ConsultSessionのQ&A履歴とAIの理解サマリーから、戦略分析プロンプトへ
 * 渡すための1つのテキストブロックを組み立てる。戦略分析(strategy-prompt.ts)
 * 側では、これを「AIマーケティングコンサルとの会話で確認した追加情報」として
 * ユーザー入力の補足情報として扱う。
 */
export function buildConsultContextText(qaItems: ConsultQaItem[], summary?: ConsultSummary): string {
  const answered = qaItems.filter((item) => item.answer !== undefined && item.answer.trim().length > 0);
  const parts: string[] = [];

  if (answered.length > 0) {
    parts.push(
      "【質問と回答】",
      ...answered.map((item, i) => `${i + 1}. Q: ${item.question} / A: ${item.answer}`),
    );
  }

  if (summary) {
    parts.push(
      "",
      "【AIが理解した内容】",
      `ターゲット: ${summary.target}`,
      `USP: ${summary.usp}`,
      `ベネフィット: ${summary.benefit}`,
      `根拠: ${summary.evidence}`,
      `目的: ${summary.purpose}`,
      `CTA: ${summary.cta}`,
    );
  }

  return parts.join("\n");
}
