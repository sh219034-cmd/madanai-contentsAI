"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGeneratedContent } from "@/lib/hooks/useGeneratedContent";
import { PdfDocument } from "@/components/pdf/PdfDocument";

export default function PdfPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { content, status } = useGeneratedContent(id);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-neutral-400">
        読み込み中...
      </main>
    );
  }

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-extrabold text-neutral-900">
          コンテンツが見つかりません
        </h1>
        <p className="text-sm leading-7 text-neutral-500">
          このブラウザに保存された生成結果が見つかりませんでした。入力画面からやり直してください。
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
        >
          ← 入力画面へ戻る
        </Link>
      </main>
    );
  }

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: content.input.theme,
          sections: content.pdf.sections,
        }),
      });
      if (!res.ok) {
        const json: { message?: string } = await res.json().catch(() => ({}));
        throw new Error(json.message ?? "PDFの生成に失敗しました。");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${content.input.theme || "madanai-content"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDFの生成に失敗しました。");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link
            href={`/result/${id}`}
            className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800"
          >
            ← 生成結果画面へ戻る
          </Link>
          <div className="flex items-center gap-3">
            {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              {downloading ? "PDFを作成しています…" : "PDFをダウンロード"}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-x-auto bg-neutral-200 py-10">
        <PdfDocument sections={content.pdf.sections} />
      </main>
    </div>
  );
}
