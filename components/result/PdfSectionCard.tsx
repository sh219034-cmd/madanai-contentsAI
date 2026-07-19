"use client";

import { useLayoutEffect, useRef } from "react";
import type { PdfSection } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { RegenerateButton } from "./RegenerateButton";

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function buildCopyText(section: PdfSection): string {
  const parts = [section.title, section.body].filter(Boolean);
  if (section.items?.length) {
    parts.push(
      section.items.filter((item) => item.trim().length > 0).join("\n"),
    );
  }
  return parts.join("\n\n");
}

export function PdfSectionCard({
  section,
  label,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  section: PdfSection;
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (patch: Partial<PdfSection>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const hasItems = section.type === "toc" || section.type === "checklist";
  const itemCount =
    section.items?.filter((item) => item.trim().length > 0).length ?? 0;
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (titleRef.current) autoResize(titleRef.current);
  }, [section.title]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-2.5 py-1 text-[11px] font-bold text-white">
            {label}
          </span>
          {hasItems ? (
            <span className="text-[11px] font-semibold text-neutral-400">
              {itemCount}項目
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="上に移動"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="下に移動"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="このセクションを削除"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
          >
            削除
          </button>
        </div>
      </div>

      <textarea
        ref={titleRef}
        className="mb-2 min-h-8 w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent p-0 text-[16px] font-bold leading-snug text-neutral-900 outline-none focus:border-neutral-200 focus:bg-neutral-50 focus:p-2"
        value={section.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="セクションタイトル"
        rows={1}
      />

      <textarea
        className="mb-3 min-h-20 w-full resize-y rounded-lg border border-transparent bg-transparent p-0 text-[14.5px] leading-relaxed text-neutral-700 outline-none focus:border-neutral-200 focus:bg-neutral-50 focus:p-2"
        value={section.body}
        onChange={(e) => onUpdate({ body: e.target.value })}
        placeholder="本文"
      />

      {hasItems ? (
        <textarea
          className="mb-3 min-h-40 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[14px] leading-relaxed text-neutral-700 outline-none focus:border-neutral-300"
          value={(section.items ?? []).join("\n")}
          onChange={(e) => onUpdate({ items: e.target.value.split("\n") })}
          placeholder="1行に1項目"
        />
      ) : null}

      <div className="flex items-center gap-2">
        <CopyButton text={buildCopyText(section)} />
        <RegenerateButton />
      </div>
    </div>
  );
}
