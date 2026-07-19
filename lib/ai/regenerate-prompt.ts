import type { ContentInput } from "@/lib/types";
import type { RegenerateKind } from "./regenerate-types";

const KIND_DESCRIPTION: Record<RegenerateKind, string> = {
  strategyField: "マーケティング戦略の1項目",
  pdfSection: "特典PDFの1セクション（タイトル・本文・チェックリスト等の項目があれば含む）",
  lineMessage: "LINE配信用文章の1つ",
  threadsPost: "Threads投稿文（指定された訴求角度を保つこと）",
  instagramPost: "Instagram投稿文",
  instagramHashtags: "Instagramハッシュタグの一覧",
  imagePrompt: "画像生成用プロンプト",
  ctaField: "CTA・導線設計の1項目",
};

function formatCurrent(current: string | string[] | Record<string, unknown>): string {
  if (typeof current === "string") return current;
  if (Array.isArray(current)) return current.join("\n");
  return JSON.stringify(current, null, 2);
}

export function buildRegenerateUserPrompt(params: {
  input: ContentInput;
  kind: RegenerateKind;
  label: string;
  current: string | string[] | Record<string, unknown>;
  instruction?: string;
}): string {
  const { input, kind, label, current, instruction } = params;

  const lines = [
    "以下は、マダナイの特典コンテンツのうち、1箇所だけを再生成する依頼です。",
    "他のセクションとの整合性を保ちながら、対象の部分だけを作り直してください。",
    "",
    `テーマ: ${input.theme}`,
    `ターゲット: ${input.target}`,
    `ターゲットの悩み: ${input.targetPain}`,
    `文章の雰囲気: ${input.tone}`,
    `最終的に誘導したい行動: ${input.desiredAction}`,
    "",
    `再生成する対象の種類: ${KIND_DESCRIPTION[kind]}`,
    `対象のラベル: ${label}`,
    "",
    "現在の内容:",
    formatCurrent(current),
  ];

  if (instruction && instruction.trim().length > 0) {
    lines.push("", `ユーザーからの追加指示: ${instruction.trim()}`);
  }

  lines.push(
    "",
    "指定されたJSON構造のみを出力し、それ以外の文章は含めないでください。",
  );

  return lines.join("\n");
}
