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

/**
 * PDFの各セクションは
 * 「①共感 → ②原因 → ③知識 → ④チェックリスト → ⑤限界提示 → ⑥相談導線」
 * のマーケティング品質順序を型として固定する。
 */
export type PdfSectionType =
  | "cover"
  | "empathy"
  | "cause"
  | "knowledge"
  | "checklist"
  | "limitation"
  | "cta";

export type PdfSection = {
  id: string;
  type: PdfSectionType;
  heading: string;
  body: string;
  items?: string[]; // type === "checklist" のときのみ使用
};

export type GeneratedContent = {
  id: string;
  createdAt: string;
  input: ContentInput;

  pdfTitle: string;
  pdfSections: PdfSection[];

  lineAnnouncement: string;
  deliveryMessage: string;
  followUpMessage: string;

  threadsPosts: [string, string, string];
  instagramPost: string;
};
