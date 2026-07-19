import type { PdfSection } from "@/lib/types";
import { MADANAI_BRAND } from "@/lib/madanai-brand";
import { pdfSectionLabel } from "@/lib/pdf/section-label";
import { buildSectionRenderModel, type SectionRenderModel } from "@/lib/pdf/section-render-model";
import { PDF_STYLES } from "@/components/pdf/PdfDocument";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 正規化済みモデル(SectionRenderModel)をHTML文字列として描画するだけの
 * 薄い葉実装。「どの型にどのフィールドを出すか」の判断は
 * lib/pdf/section-render-model.ts に共通化済みのため、ここでは
 * 受け取ったkindごとにHTML文字列を組み立てるだけ(PdfDocument.tsxの
 * SectionByModelとペアになる実装)。
 */
function renderSectionByModel(model: SectionRenderModel): string {
  switch (model.kind) {
    case "cover":
      return `<div class="pdf-cover"><span class="pdf-cover__bar"></span><h1 class="pdf-cover__title">${escapeHtml(model.title)}</h1><span class="pdf-cover__brand">${escapeHtml(model.brandName)}</span></div>`;
    case "subtitle":
      return `<div class="pdf-subtitle"><p class="pdf-subtitle__text">${escapeHtml(model.text)}</p></div>`;
    case "toc":
      return `${renderHeading(model.label, model.title)}<ol class="pdf-toc-list">${model.items
        .map(
          (item, index) =>
            `<li><span class="pdf-toc-index">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(item)}</span></li>`,
        )
        .join("")}</ol>`;
    case "checklist":
      return `${renderHeading(model.label, model.title)}${
        model.intro ? `<p class="pdf-paragraph" style="margin-bottom:8mm;">${escapeHtml(model.intro)}</p>` : ""
      }<ul class="pdf-checklist">${model.items
        .map((item) => `<li><span class="pdf-checkbox"></span><span>${escapeHtml(item)}</span></li>`)
        .join("")}</ul>`;
    case "cta":
      return `${renderHeading(model.label, model.title)}<div class="pdf-cta-box"><p class="pdf-paragraph">${escapeHtml(model.body)}</p></div>`;
    case "text":
      return `${renderHeading(model.label, model.title)}<p class="pdf-paragraph">${escapeHtml(model.body)}</p>`;
  }
}

function renderHeading(label: string, title: string): string {
  return `<div class="pdf-heading"><span class="pdf-heading__bar"></span><div><p class="pdf-heading__label">${escapeHtml(label)}</p><h2 class="pdf-heading__text">${escapeHtml(title)}</h2></div></div>`;
}

function renderPage(section: PdfSection, label: string, index: number, total: number): string {
  const model = buildSectionRenderModel(section, label);
  return `<section class="pdf-page"><header class="pdf-page__header"><span class="pdf-page__logo"><span class="pdf-page__logo-mark"></span>${escapeHtml(MADANAI_BRAND.name)}</span></header><div class="pdf-page__body">${renderSectionByModel(model)}</div><footer class="pdf-page__footer">${index + 1} / ${total}</footer></section>`;
}

/**
 * ブラウザプレビュー(components/pdf/PdfDocument.tsx)と同じCSS(PDF_STYLES)・
 * セクションラベル・正規化ロジック(buildSectionRenderModel)を使い、
 * 同じレイアウトのHTMLを文字列として組み立てる。
 * Next.js(App Router)はapp/配下からreact-dom/serverを静的import不可のため、
 * PlaywrightへわたすHTMLはReactを使わずここで生成する。
 * ユーザーが編集可能なタイトル・本文・項目は必ずescapeHtmlを通す。
 */
export function renderPdfDocumentHtml(sections: PdfSection[], title: string): string {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const total = ordered.length;
  const pages = ordered
    .map((section, index) => {
      const bodyIndex = ordered.slice(0, index).filter((s) => s.type === "body").length;
      const label = pdfSectionLabel(section, bodyIndex);
      return renderPage(section, label, index, total);
    })
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${PDF_STYLES}</style>
</head>
<body style="margin:0;">
<div class="pdf-doc">${pages}</div>
</body>
</html>`;
}
