/**
 * マダナイの固定ブランド情報。
 * 複数ブランドは扱わないため設定画面は作らず、変更が必要な場合は
 * このファイルを直接編集する運用とする。
 */
export const MADANAI_BRAND = {
  name: "マダナイ？",
  concept: "「まだない？」を「もうある。」へ。",
  positioning:
    "ホームページ制作会社ではなく、AIとWEBを活用して集客・売上・業務効率化まで支援する会社。",
  toneGuideline:
    "専門的だが親しみやすい。断定しすぎず、読者の次の一歩を軽くする。煽らない。",
  ngExpressions: [
    "絶対に",
    "誰でも簡単に稼げる",
    "必ず成果が出ます",
    "業界最安",
    "今だけ",
  ],
  consultationCta:
    "ここまで読んでくれたということは、本気で変えたいと思っているはず。マダナイに、無料で話してみませんか？",
  colors: {
    background: "#ffffff",
    foreground: "#111111",
    gradientFrom: "#ff6ec7",
    gradientVia: "#a855f7",
    gradientTo: "#7c3aed",
  },
  logoPath: "/madanai-logo.svg",
} as const;

export const TONE_PRESETS = [
  "専門的だが親しみやすい",
  "落ち着いて丁寧",
  "テンポよくカジュアル",
  "温かく寄り添う",
] as const;
