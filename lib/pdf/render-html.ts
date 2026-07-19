import type { PdfSection } from "@/lib/types";
import { MADANAI_BRAND } from "@/lib/madanai-brand";
import { pdfSectionLabel } from "@/lib/pdf/section-label";
import { PDF_STYLES } from "@/components/pdf/PdfDocument";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nonEmpty(items: string[] | undefined): string[] {
  return (items ?? []).filter((item) => item.trim().length > 0);
}

function renderHeading(label: string, title: string): string {
  return `<div class="pdf-heading"><span class="pdf-heading__bar"></span><div><p class="pdf-heading__label">${escapeHtml(label)}</p><h2 class="pdf-heading__text">${escapeHtml(title)}</h2></div></div>`;
}

function renderSectionContent(section: PdfSection, label: string): string {
  switch (section.type) {
    case "cover":
      return `<div class="pdf-cover"><span class="pdf-cover__bar"></span><h1 class="pdf-cover__title">${escapeHtml(section.title)}</h1><span class="pdf-cover__brand">${escapeHtml(MADANAI_BRAND.name)}</span></div>`;
    case "subtitle":
      return `<div class="pdf-subtitle"><p class="pdf-subtitle__text">${escapeHtml(section.body || section.title)}</p></div>`;
    case "toc":
      return `${renderHeading(label, section.title)}<ol class="pdf-toc-list">${nonEmpty(section.items)
        .map(
          (item, index) =>
            `<li><span class="pdf-toc-index">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(item)}</span></li>`,
        )
        .join("")}</ol>`;
    case "checklist":
      return `${renderHeading(label, section.title)}${
        section.body
          ? `<p class="pdf-paragraph" style="margin-bottom:8mm;">${escapeHtml(section.body)}</p>`
          : ""
      }<ul class="pdf-checklist">${nonEmpty(section.items)
        .map((item) => `<li><span class="pdf-checkbox"></span><span>${escapeHtml(item)}</span></li>`)
        .join("")}</ul>`;
    case "cta":
      return `${renderHeading(label, section.title)}<div class="pdf-cta-box"><p class="pdf-paragraph">${escapeHtml(section.body)}</p></div>`;
    default:
      return `${renderHeading(label, section.title)}<p class="pdf-paragraph">${escapeHtml(section.body)}</p>`;
  }
}

function renderPage(section: PdfSection, label: string, index: number, total: number): string {
  return `<section class="pdf-page"><header class="pdf-page__header"><span class="pdf-page__logo"><span class="pdf-page__logo-mark"></span>${escapeHtml(MADANAI_BRAND.name)}</span></header><div class="pdf-page__body">${renderSectionContent(section, label)}</div><footer class="pdf-page__footer">${index + 1} / ${total}</footer></section>`;
}

/**
 * ブラウザプレビュー(components/pdf/PdfDocument.tsx)と同じCSS(PDF_STYLES)・
 * セクションラベルを使い、同じレイアウトのHTMLを文字列として組み立てる。
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
