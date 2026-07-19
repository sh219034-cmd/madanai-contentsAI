"use client";

import { useState } from "react";
import Link from "next/link";
import type { GeneratedContent } from "@/lib/types";
import type { SaveStatus } from "@/lib/hooks/useGeneratedContent";
import { buildFullCopyText } from "@/lib/export-text";
import { SaveStatusBadge } from "./SaveStatusBadge";

export function StickyActionBar({
  content,
  status,
  onShowInput,
}: {
  content: GeneratedContent;
  status: SaveStatus;
  onShowInput: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildFullCopyText(content));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードAPIが使えない環境では何もしない
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <SaveStatusBadge status={status} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onShowInput}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300"
          >
            入力内容を確認
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300"
          >
            {copied ? "コピーしました" : "すべてコピー"}
          </button>
          <Link
            href={`/result/${content.id}/pdf`}
            className="rounded-lg bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-4 py-2 text-xs font-bold text-white"
          >
            PDFプレビューへ
          </Link>
        </div>
      </div>
    </div>
  );
}
