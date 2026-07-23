export type ContentInput = {
  theme: string; // コンテンツのテーマ
  target: string; // ターゲット
  targetPain: string; // ターゲットの悩み
  offerGoal: string; // 特典の目的
  pageCount: number; // ページ数
  tone: string; // 文章の雰囲気
  desiredAction: string; // 最終的に誘導したい行動
  supplementary?: string; // 補足情報
};

export type MarketingStrategy = {
  targetProfile: string; // 想定ターゲット
  targetPain: string; // ターゲットの主な悩み
  offerValue: string; // 特典で提供する価値
  coreMessage: string; // 中心となる訴求
  desiredAction: string; // 読後に取ってほしい行動
  tone: string; // 文章全体のトーン
};

/**
 * PDFの各セクション種別。
 * cover〜cta の並び自体が
 * 「①共感 → ②原因 → ③知識 → ④チェックリスト → ⑤限界提示 → ⑥相談導線」
 * のマーケティング品質順序に対応する（docs/DESIGN.md 7章）。
 */
export type PdfSectionType =
  | "cover"
  | "subtitle"
  | "intro"
  | "toc"
  | "body"
  | "checklist"
  | "diagnosis"
  | "summary"
  | "cta";

export type PdfSection = {
  id: string;
  type: PdfSectionType;
  title: string;
  body: string;
  items?: string[]; // toc / checklist のときのみ使用
  order: number;
};

export type PdfContent = {
  sections: PdfSection[];
};

export type LineMessages = {
  announcement: string; // 特典を案内する配信文
  delivery: string; // 特典を送付する際の文章
  followUp: string; // 送付後のフォロー文章
};

export type ThreadsAngle = "empathy" | "problem" | "knowhow";

export type ThreadsPost = {
  id: string;
  angle: ThreadsAngle;
  body: string;
};

export type SnsContent = {
  threadsPosts: [ThreadsPost, ThreadsPost, ThreadsPost];
  instagramPost: string;
  instagramHashtags: string[];
  imagePrompt: string;
};

export type CtaInfo = {
  pdfCta: string; // PDF内CTA
  lineCta: string; // LINE配信のCTA
  snsCta: string; // SNS投稿のCTA
  finalDestination: string; // 最終誘導先（入力の desiredAction を反映）
  googleFormCta: string; // Googleフォームへの誘導文
};

/**
 * 直近のClaude API呼び出しのトークン使用量・概算費用（開発者向け表示用）。
 * APIキーや生成本文は含めない。
 */
export type GenerationUsage = {
  model: string;
  processType: "generate" | "regenerate" | "strategy";
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number | null;
};

/**
 * AIマーケティング分析が提案する戦略の切り口。
 * 入力内容に応じてAIが妥当なものを選ぶため、毎回同じ組み合わせにはならない。
 */
export type StrategyAngle =
  | "empathy" // 共感型
  | "problem" // 問題提起型
  | "comparison" // 比較型
  | "story" // ストーリー型
  | "beginner" // 初心者向け
  | "store" // 店舗向け
  | "b2b" // BtoB向け
  | "ai-driven" // AI活用型
  | "trust" // 信頼構築型
  | "diagnosis" // 診断型
  | "checklist" // チェックリスト型
  | "case-study" // 事例型
  | "other";

/** 反応の期待度。具体的な%は使わず4段階の相対評価にとどめる（成果保証を避けるため）。 */
export type ExpectedResponseLevel = "低" | "中" | "高" | "非常に高い";

export type StrategyCandidate = {
  id: string;
  angle: StrategyAngle;
  name: string; // 戦略名（例:「共感型」）
  targetPsychology: string; // 狙う心理
  whyItWorks: string; // なぜ刺さりやすいか
  expectedResponseLevel: ExpectedResponseLevel; // 反応の期待度
  inquiryReason: string; // 問い合わせにつながりやすいと考える理由（可能性としての表現）
  recommendationScore: 1 | 2 | 3 | 4 | 5; // おすすめ度
  contentFlow: string[]; // 想定する構成（例:["共感","問題の原因","チェックリスト","自己診断","無料相談"]）
  isRecommended: boolean; // 候補中ちょうど1件のみtrue
  recommendationReason?: string; // isRecommended===trueの場合のみ
};

/**
 * AIマーケティング分析の結果。GeneratedContentとは別に保存し、
 * 「戦略を変更」時に再分析せず同じ候補一覧を再利用できるようにする。
 */
export type StrategyAnalysis = {
  id: string; // 生成される最初のGeneratedContent.idを引き継ぐ（複製時は新IDで別レコードを作る）
  createdAt: string;
  input: ContentInput;
  candidates: StrategyCandidate[]; // 最低5件
  usage?: GenerationUsage;
  isMock?: boolean; // 「サンプルで確認する」由来の固定データかどうか
};

export type GeneratedContent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: ContentInput;
  selectedStrategy: StrategyCandidate; // 選択時点の戦略のスナップショット
  strategy: MarketingStrategy; // 選択済み戦略に沿って生成された実行レベルのブリーフ
  pdf: PdfContent;
  line: LineMessages;
  sns: SnsContent;
  cta: CtaInfo;
  lastUsage?: GenerationUsage;
  /**
   * 「戦略を変更」→「複製して別案を作る」、または履歴画面の「複製」から
   * 作成された場合に"duplicate"を設定する（履歴画面での状態表示に使う）。
   * 通常の生成・上書きではundefinedのまま。
   */
  origin?: "duplicate";
};

/** 履歴画面(/history)でのカード表示用の状態。 */
export type HistoryStatus = "strategy-only" | "generated" | "duplicate" | "sample";

/**
 * StrategyAnalysisとGeneratedContentを id で突き合わせた、履歴画面用の統合ビュー。
 * lib/history-storage.ts の getHistoryItems() が組み立てる。
 */
export type HistoryItem = {
  id: string;
  theme: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  status: HistoryStatus;
  selectedStrategyName?: string;
  hasAnalysis: boolean;
  hasContent: boolean;
};
