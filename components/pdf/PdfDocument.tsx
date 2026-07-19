import type { PdfSection } from "@/lib/types";
import { MADANAI_BRAND } from "@/lib/madanai-brand";
import { pdfSectionLabel } from "@/lib/pdf/section-label";
import { buildSectionRenderModel, type SectionRenderModel } from "@/lib/pdf/section-render-model";

/**
 * マダナイ特典PDFの唯一のテンプレート（DESIGN.md 8章）。
 * ブラウザプレビュー(/result/[id]/pdf)で使用する。
 * Tailwindのビルドに依存しないよう、スタイルはこのファイル内の
 * プレーンCSS文字列(<style>)のみで完結させている。
 *
 * 注意: Next.js(App Router)は app/ 配下から react-dom/server を
 * importできないため、PDFダウンロード(/api/pdf)側は同じPDF_STYLES・
 * pdfSectionLabel・buildSectionRenderModel(lib/pdf/section-render-model.ts)
 * を使いつつ、HTMLをReactを使わない文字列で別途組み立てている
 * (lib/pdf/render-html.ts)。「どの型に何を表示するか」の判断は
 * buildSectionRenderModelに共通化済みのため、レイアウト変更時に
 * 二重で直す必要があるのは見た目のマークアップ(このファイルのJSXと
 * render-html.tsのHTML文字列)のみ。
 */
export const PDF_STYLES = `
.pdf-doc {
  --pdf-fg: ${MADANAI_BRAND.colors.foreground};
  --pdf-grad: linear-gradient(135deg, ${MADANAI_BRAND.colors.gradientFrom} 0%, ${MADANAI_BRAND.colors.gradientVia} 55%, ${MADANAI_BRAND.colors.gradientTo} 100%);
  --pdf-muted: #6b7280;
  --pdf-border: #e5e5e5;
  font-family: "Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic Medium",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color: var(--pdf-fg);
  background: #e5e5e5;
  padding: 10mm 0;
}
.pdf-page {
  position: relative;
  box-sizing: border-box;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 10mm;
  padding: 20mm 18mm 16mm;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
}
.pdf-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12mm;
}
.pdf-page__logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5pt;
  font-weight: 700;
}
.pdf-page__logo-mark {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: var(--pdf-grad);
  display: inline-block;
  flex-shrink: 0;
}
.pdf-page__body { flex: 1; }
.pdf-page__footer {
  margin-top: auto;
  padding-top: 8mm;
  display: flex;
  justify-content: flex-end;
  font-size: 8.5pt;
  color: var(--pdf-muted);
}

.pdf-heading { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8mm; }
.pdf-heading__bar { width: 4px; height: 20px; border-radius: 2px; background: var(--pdf-grad); flex-shrink: 0; margin-top: 3px; }
.pdf-heading__label { font-size: 8.5pt; font-weight: 700; color: var(--pdf-muted); letter-spacing: .08em; text-transform: uppercase; margin: 0 0 1mm; }
.pdf-heading__text { font-size: 16pt; font-weight: 800; line-height: 1.5; margin: 0; }
.pdf-paragraph { font-size: 11pt; line-height: 1.9; white-space: pre-wrap; margin: 0; }

.pdf-cover { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; gap: 10mm; }
.pdf-cover__bar { width: 32mm; height: 3mm; border-radius: 2mm; background: var(--pdf-grad); }
.pdf-cover__title { font-size: 25pt; font-weight: 800; line-height: 1.5; letter-spacing: -.01em; margin: 0; }
.pdf-cover__brand { font-size: 10pt; color: var(--pdf-muted); }

.pdf-subtitle { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; gap: 6mm; }
.pdf-subtitle__text { font-size: 14.5pt; line-height: 1.9; font-weight: 600; white-space: pre-wrap; margin: 0; }

.pdf-toc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5mm; }
.pdf-toc-list li { display: flex; align-items: baseline; gap: 3mm; font-size: 11.5pt; }
.pdf-toc-index { font-weight: 800; background: var(--pdf-grad); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 12pt; min-width: 7mm; }

.pdf-checklist { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4mm; }
.pdf-checklist li { display: flex; align-items: flex-start; gap: 3mm; font-size: 11pt; line-height: 1.7; break-inside: avoid; }
.pdf-checkbox { width: 4mm; height: 4mm; border: 1.4pt solid ${MADANAI_BRAND.colors.gradientVia}; border-radius: 1mm; flex-shrink: 0; margin-top: 1mm; }

.pdf-cta-box { background: var(--pdf-grad); border-radius: 6mm; padding: 12mm; color: #ffffff; text-align: center; }
.pdf-cta-box .pdf-paragraph { color: #ffffff; font-weight: 600; }

@media print {
  .pdf-doc { background: #ffffff; padding: 0; }
  .pdf-page { box-shadow: none; margin: 0; break-after: page; }
  .pdf-page:last-child { break-after: auto; }
}
`;

function LogoMark() {
  return (
    <span className="pdf-page__logo">
      <span className="pdf-page__logo-mark" />
      {MADANAI_BRAND.name}
    </span>
  );
}

function Heading({ label, title }: { label: string; title: string }) {
  return (
    <div className="pdf-heading">
      <span className="pdf-heading__bar" />
      <div>
        <p className="pdf-heading__label">{label}</p>
        <h2 className="pdf-heading__text">{title}</h2>
      </div>
    </div>
  );
}

/**
 * 正規化済みモデル(SectionRenderModel)を描画するだけの薄い葉実装。
 * 「どの型にどのフィールドを出すか」の判断は lib/pdf/section-render-model.ts
 * に共通化済みのため、ここでは受け取ったkindごとにマークアップを出すだけ。
 */
function SectionByModel({ model }: { model: SectionRenderModel }) {
  switch (model.kind) {
    case "cover":
      return (
        <div className="pdf-cover">
          <span className="pdf-cover__bar" />
          <h1 className="pdf-cover__title">{model.title}</h1>
          <span className="pdf-cover__brand">{model.brandName}</span>
        </div>
      );
    case "subtitle":
      return (
        <div className="pdf-subtitle">
          <p className="pdf-subtitle__text">{model.text}</p>
        </div>
      );
    case "toc":
      return (
        <>
          <Heading label={model.label} title={model.title} />
          <ol className="pdf-toc-list">
            {model.items.map((item, index) => (
              <li key={index}>
                <span className="pdf-toc-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </>
      );
    case "checklist":
      return (
        <>
          <Heading label={model.label} title={model.title} />
          {model.intro ? (
            <p className="pdf-paragraph" style={{ marginBottom: "8mm" }}>
              {model.intro}
            </p>
          ) : null}
          <ul className="pdf-checklist">
            {model.items.map((item, index) => (
              <li key={index}>
                <span className="pdf-checkbox" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      );
    case "cta":
      return (
        <>
          <Heading label={model.label} title={model.title} />
          <div className="pdf-cta-box">
            <p className="pdf-paragraph">{model.body}</p>
          </div>
        </>
      );
    case "text":
      return (
        <>
          <Heading label={model.label} title={model.title} />
          <p className="pdf-paragraph">{model.body}</p>
        </>
      );
  }
}

export function PdfDocument({ sections }: { sections: PdfSection[] }) {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const total = ordered.length;

  return (
    <div className="pdf-doc">
      <style>{PDF_STYLES}</style>
      {ordered.map((section, index) => {
        const bodyIndex = ordered.slice(0, index).filter((s) => s.type === "body").length;
        const label = pdfSectionLabel(section, bodyIndex);
        const model = buildSectionRenderModel(section, label);
        return (
          <section className="pdf-page" key={section.id}>
            <header className="pdf-page__header">
              <LogoMark />
            </header>
            <div className="pdf-page__body">
              <SectionByModel model={model} />
            </div>
            <footer className="pdf-page__footer">
              {index + 1} / {total}
            </footer>
          </section>
        );
      })}
    </div>
  );
}
