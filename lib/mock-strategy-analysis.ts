import type { ContentInput, StrategyAnalysis, StrategyCandidate } from "./types";

/**
 * 「サンプルで確認する」専用の固定戦略候補（5件）。
 * 実際のAI分析では入力内容に応じて候補の組み合わせ・件数が変わるが、
 * サンプルはFIXED_DEMO_INPUTのテーマに対する固定の一例として扱う。
 */
const FIXED_CANDIDATES: Omit<StrategyCandidate, "id">[] = [
  {
    angle: "empathy",
    name: "共感型",
    targetPsychology:
      "「自分のホームページも同じかもしれない」という共感から警戒心を解き、最後まで読んでもらう",
    whyItWorks:
      "多くの競合が機能や実績から入るため、感情に寄り添う導入は差別化になりやすい構成です",
    expectedResponseLevel: "非常に高い",
    inquiryReason:
      "チェックリストで自分ごと化した直後に相談導線を置けるため、行動への心理的なハードルを下げやすい構成です",
    recommendationScore: 5,
    contentFlow: ["共感", "問題の原因", "チェックリスト", "自己診断", "無料相談"],
    isRecommended: true,
    recommendationReason:
      "「ホームページはあるが問い合わせが来ない」という、当事者が気づきにくい悩みに対しては、いきなり正しさを説くより、共感から入る流れが最も届きやすいと考えられます。",
  },
  {
    angle: "problem",
    name: "問題提起型",
    targetPsychology: "「なぜ問い合わせが来ないのか」を先に言語化されることで、当事者意識を持ってもらう",
    whyItWorks:
      "すでに課題を自覚している層には、共感より先に原因を提示するほうが刺さりやすい可能性があります",
    expectedResponseLevel: "高",
    inquiryReason:
      "問題の構造を理解した直後にチェックリストへ誘導できるため、比較検討中の読者にも届きやすい可能性があります",
    recommendationScore: 4,
    contentFlow: ["問題提起", "原因の解説", "チェックリスト", "診断結果", "無料相談"],
    isRecommended: false,
  },
  {
    angle: "checklist",
    name: "チェックリスト型",
    targetPsychology: "「今すぐ確認したい」という行動意欲の高い読者に向けて、実践のハードルを下げる",
    whyItWorks:
      "テーマ自体がチェックリスト形式のため、導入を最小限にして早く本題に入る構成は違和感なく読み進めやすい可能性があります",
    expectedResponseLevel: "高",
    inquiryReason:
      "チェック作業そのものが行動のきっかけになるため、行動への心理的なハードルを下げやすい構成です",
    recommendationScore: 4,
    contentFlow: ["チェックの目的説明", "チェックリスト", "診断結果", "まとめ", "無料相談"],
    isRecommended: false,
  },
  {
    angle: "comparison",
    name: "比較型",
    targetPsychology: "「良いホームページ／伸び悩むホームページ」を対比させ、自社の立ち位置を客観視してもらう",
    whyItWorks:
      "現状に強い危機感を持っていない読者には効果が薄れる可能性がありますが、比較検討段階の読者には届きやすい構成です",
    expectedResponseLevel: "中",
    inquiryReason:
      "自社の立ち位置を客観視した直後に相談導線を置くことで、次の一歩を後押ししやすい可能性があります",
    recommendationScore: 3,
    contentFlow: ["比較の視点提示", "良い例・伸び悩む例", "チェックリスト", "自己診断", "無料相談"],
    isRecommended: false,
  },
  {
    angle: "beginner",
    name: "初心者向け",
    targetPsychology: "「専門用語が分からず不安」という読者に、知らなくて当然という前提で寄り添う",
    whyItWorks:
      "IT・WEBに不慣れな層には安心感がありますが、経験者にはやや冗長に感じられる可能性があります",
    expectedResponseLevel: "高",
    inquiryReason:
      "専門用語を避けた丁寧な解説により、行動への心理的なハードルを下げやすい可能性があります",
    recommendationScore: 4,
    contentFlow: ["やさしい導入", "基礎知識の解説", "チェックリスト", "診断結果", "無料相談"],
    isRecommended: false,
  },
];

function withIds(id: string): StrategyCandidate[] {
  return FIXED_CANDIDATES.map((candidate, index) => ({
    ...candidate,
    id: `${id}-strategy-${index}`,
  }));
}

export function buildMockStrategyAnalysis(id: string, input: ContentInput): StrategyAnalysis {
  return {
    id,
    createdAt: new Date().toISOString(),
    input,
    candidates: withIds(id),
    isMock: true,
  };
}
