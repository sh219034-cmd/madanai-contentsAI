import type { ContentInput, StrategyCandidate } from "@/lib/types";

/**
 * 入力内容・選択済み戦略から生成リクエストのユーザーメッセージを組み立てる。
 * strategyは/strategy/[id]でユーザーが選んだ戦略候補であり、AIが戦略の
 * 切り口自体を自由に考え直すことはできない制約として渡す。
 */
export function buildGenerationUserPrompt(
  input: ContentInput,
  strategy: StrategyCandidate,
): string {
  const lines = [
    "以下の情報をもとに、マダナイのLINE登録特典コンテンツ一式を作成してください。",
    "",
    `コンテンツのテーマ: ${input.theme}`,
    `ターゲット: ${input.target}`,
    `ターゲットの悩み: ${input.targetPain}`,
    `特典の目的: ${input.offerGoal}`,
    `特典PDFの目安ページ数: ${input.pageCount}ページ（本文セクション数や各セクションの分量の参考にすること）`,
    `文章の雰囲気: ${input.tone}`,
    `最終的に誘導したい行動: ${input.desiredAction}`,
  ];

  if (input.supplementary && input.supplementary.trim().length > 0) {
    lines.push(`補足情報: ${input.supplementary}`);
  }

  lines.push(
    "",
    "■採用する戦略（変更不可・必ず反映すること）",
    "この戦略はユーザーが既に選択済みです。別の切り口を考え直さず、以下の方針にすべての文章を合わせてください。",
    `戦略名: ${strategy.name}`,
    `狙う心理: ${strategy.targetPsychology}`,
    `なぜ刺さりやすいか: ${strategy.whyItWorks}`,
    `想定する構成の流れ: ${strategy.contentFlow.join(" → ")}`,
  );

  lines.push(
    "",
    "作成するもの:",
    "1. マーケティング戦略の実行ブリーフ（想定ターゲット・ターゲットの主な悩み・特典で提供する価値・中心となる訴求・読後に取ってほしい行動・文章全体のトーン）。中心となる訴求は上記「採用する戦略」の狙う心理と矛盾しないこと",
    "2. 特典PDF（システムプロンプトで指定した順序のセクション構成。本文は「想定する構成の流れ」に沿って複数セクションに分け、チェックリストは実践できる具体的な項目を列挙すること）",
    "3. LINE配信用文章（①特典を案内する配信文 ②特典を送付する際の文章 ③送付後のフォロー文章）",
    "4. SNS投稿（Threads投稿文3案：共感型・問題提起型・ノウハウ型のそれぞれ異なる訴求角度で作成すること／Instagram投稿文1案／Instagramハッシュタグ／画像生成用プロンプト1案）",
    "5. CTA・導線設計（PDF内CTA・LINE配信のCTA・SNS投稿のCTA・最終誘導先・Googleフォームへの誘導文）。最終誘導先は「最終的に誘導したい行動」の内容を反映すること",
    "",
    "指定されたJSON構造のみを出力し、それ以外の文章は含めないでください。",
  );

  return lines.join("\n");
}
