import type { PdfSection } from "@/lib/types";

/**
 * PDFセクションの日本語ラベル。結果編集画面(PdfSectionList)とPDFテンプレート
 * (PdfDocument)の両方で同じ表記を使うための共通ロジック。
 */
export function pdfSectionLabel(section: PdfSection, bodyIndex: number): string {
  switch (section.type) {
    case "cover":
      return "表紙";
    case "subtitle":
      return "サブタイトル";
    case "intro":
      return "導入文";
    case "toc":
      return "目次";
    case "body":
      return `本文${bodyIndex + 1}`;
    case "checklist":
      return "チェックリスト";
    case "diagnosis":
      return "診断結果";
    case "summary":
      return "まとめ";
    case "cta":
      return "CTA";
    default:
      return "セクション";
  }
}
