"use client";

import type { ContentInput, GeneratedContent, PdfContent, PdfSection } from "@/lib/types";
import { pdfSectionLabel } from "@/lib/pdf/section-label";
import { PdfSectionCard } from "./PdfSectionCard";
import { SectionHeading } from "./SectionHeading";

function reindex(sections: PdfSection[]): PdfSection[] {
  return sections.map((section, index) => ({ ...section, order: index }));
}

export function PdfSectionList({
  input,
  pdf,
  mutate,
}: {
  input: ContentInput;
  pdf: PdfContent;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const sections = [...pdf.sections].sort((a, b) => a.order - b.order);

  const updateSections = (next: PdfSection[]) => {
    mutate((prev) => ({ ...prev, pdf: { sections: reindex(next) } }));
  };

  const handleUpdate = (id: string, patch: Partial<PdfSection>) => {
    updateSections(
      sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );
  };

  const handleMove = (id: string, direction: -1 | 1) => {
    const index = sections.findIndex((section) => section.id === id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= sections.length) {
      return;
    }
    const next = [...sections];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateSections(next);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("このセクションを削除しますか？")) return;
    updateSections(sections.filter((section) => section.id !== id));
  };

  const handleAdd = () => {
    const newSection: PdfSection = {
      id: `custom-${crypto.randomUUID()}`,
      type: "body",
      title: "新しいセクション",
      body: "",
      order: sections.length,
    };
    updateSections([...sections, newSection]);
  };

  return (
    <section>
      <SectionHeading
        index={2}
        title="特典PDF"
        description="表紙からCTAまで、A4縦のPDFに流し込む前提のセクション構成です。並び替え・追加・削除ができます。"
      />
      <div className="flex flex-col gap-4">
        {sections.map((section, index) => {
          const currentBodyIndex = sections
            .slice(0, index)
            .filter((s) => s.type === "body").length;
          return (
            <PdfSectionCard
              key={section.id}
              input={input}
              section={section}
              label={pdfSectionLabel(section, currentBodyIndex)}
              canMoveUp={index > 0}
              canMoveDown={index < sections.length - 1}
              onUpdate={(patch) => handleUpdate(section.id, patch)}
              onMoveUp={() => handleMove(section.id, -1)}
              onMoveDown={() => handleMove(section.id, 1)}
              onDelete={() => handleDelete(section.id)}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 w-full rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-semibold text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-700"
      >
        ＋ セクションを追加
      </button>
    </section>
  );
}
