import type { GeneratedContent } from "./types";

const THREADS_ANGLE_LABEL: Record<string, string> = {
  empathy: "共感型",
  problem: "問題提起型",
  knowhow: "ノウハウ型",
};

/**
 * 生成結果全体を、そのままLINEやメモに貼り付けやすいテキストにまとめる。
 * 「すべてコピー」ボタンで使用する。
 */
export function buildFullCopyText(content: GeneratedContent): string {
  const lines: string[] = [];

  lines.push(`■ ${content.input.theme}`, "");

  lines.push("【マーケティング戦略】");
  lines.push(`想定ターゲット: ${content.strategy.targetProfile}`);
  lines.push(`ターゲットの主な悩み: ${content.strategy.targetPain}`);
  lines.push(`特典で提供する価値: ${content.strategy.offerValue}`);
  lines.push(`中心となる訴求: ${content.strategy.coreMessage}`);
  lines.push(`読後に取ってほしい行動: ${content.strategy.desiredAction}`);
  lines.push(`文章全体のトーン: ${content.strategy.tone}`, "");

  lines.push("【特典PDF】");
  for (const section of [...content.pdf.sections].sort((a, b) => a.order - b.order)) {
    lines.push(`◇ ${section.title}`);
    if (section.body) lines.push(section.body);
    if (section.items?.length) {
      for (const item of section.items) lines.push(`- ${item}`);
    }
    lines.push("");
  }

  lines.push("【LINE配信用文章】");
  lines.push("① 特典を案内する配信文", content.line.announcement, "");
  lines.push("② 特典を送付する際の文章", content.line.delivery, "");
  lines.push("③ 送付後のフォロー文章", content.line.followUp, "");

  lines.push("【SNS投稿】");
  for (const post of content.sns.threadsPosts) {
    lines.push(`Threads（${THREADS_ANGLE_LABEL[post.angle] ?? post.angle}）`, post.body, "");
  }
  lines.push("Instagram投稿文", content.sns.instagramPost, "");
  lines.push("Instagramハッシュタグ", content.sns.instagramHashtags.join(" "), "");
  lines.push("画像生成用プロンプト", content.sns.imagePrompt, "");

  lines.push("【CTA・導線設計】");
  lines.push(`PDF内CTA: ${content.cta.pdfCta}`);
  lines.push(`LINE配信のCTA: ${content.cta.lineCta}`);
  lines.push(`SNS投稿のCTA: ${content.cta.snsCta}`);
  lines.push(`最終誘導先: ${content.cta.finalDestination}`);
  lines.push(`Googleフォームへの誘導文: ${content.cta.googleFormCta}`);

  return lines.join("\n");
}
