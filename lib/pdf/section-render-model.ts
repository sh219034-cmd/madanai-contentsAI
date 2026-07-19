import type { PdfSection } from "@/lib/types";
import { MADANAI_BRAND } from "@/lib/madanai-brand";

/**
 * PdfSectionを「どの型にどのフィールドを表示するか」まで正規化したデータ。
 * この変換をここに1箇所だけ持つことで、ブラウザプレビュー(PdfDocument.tsx)と
 * PDFダウンロード用HTML(render-html.ts)の両方が「正規化済みデータを
 * 描画するだけ」の薄い葉実装で済む。
 * (STEP F: PDF共通化リファクタリング)
 */
export type SectionRenderModel =
  | { kind: "cover"; title: string; brandName: string }
  | { kind: "subtitle"; text: string }
  | { kind: "toc"; label: string; title: string; items: string[] }
  | { kind: "checklist"; label: string; title: string; intro: string; items: string[] }
  | { kind: "cta"; label: string; title: string; body: string }
  | { kind: "text"; label: string; title: string; body: string };

function nonEmptyItems(items: string[] | undefined): string[] {
  return (items ?? []).filter((item) => item.trim().length > 0);
}

/**
 * @param label セクションの表示ラベル（呼び出し側で lib/pdf/section-label.ts の
 *   pdfSectionLabel を使って、ページ内の位置(本文の何番目か等)から計算して渡す）
 */
export function buildSectionRenderModel(section: PdfSection, label: string): SectionRenderModel {
  switch (section.type) {
    case "cover":
      return { kind: "cover", title: section.title, brandName: MADANAI_BRAND.name };
    case "subtitle":
      return { kind: "subtitle", text: section.body || section.title };
    case "toc":
      return { kind: "toc", label, title: section.title, items: nonEmptyItems(section.items) };
    case "checklist":
      return {
        kind: "checklist",
        label,
        title: section.title,
        intro: section.body,
        items: nonEmptyItems(section.items),
      };
    case "cta":
      return { kind: "cta", label, title: section.title, body: section.body };
    default:
      // intro / body / diagnosis / summary は同じ「見出し+本文」レイアウトを使う
      return { kind: "text", label, title: section.title, body: section.body };
  }
}
