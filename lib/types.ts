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

export type GeneratedContent = {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: ContentInput;
  strategy: MarketingStrategy;
  pdf: PdfContent;
  line: LineMessages;
  sns: SnsContent;
  cta: CtaInfo;
};
