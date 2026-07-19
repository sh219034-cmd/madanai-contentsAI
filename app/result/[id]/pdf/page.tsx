"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PdfPreviewPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
        PDFプレビュー
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
        STEP5・STEP6で実装予定です
      </h1>
      <p className="text-sm leading-7 text-neutral-500">
        A4縦・HTML/CSSテンプレートによるPDFプレビューとダウンロードは、docs/DESIGN.mdの開発ステップに沿ってSTEP5・STEP6で実装します。
      </p>
      <Link
        href={`/result/${params.id}`}
        className="mt-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
      >
        ← 生成結果画面へ戻る
      </Link>
    </main>
  );
}
