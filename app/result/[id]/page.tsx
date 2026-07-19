"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGeneratedContent } from "@/lib/hooks/useGeneratedContent";
import { ResultHeader } from "@/components/result/ResultHeader";
import { StrategySection } from "@/components/result/StrategySection";
import { PdfSectionList } from "@/components/result/PdfSectionList";
import { LineMessagesSection } from "@/components/result/LineMessagesSection";
import { SnsSection } from "@/components/result/SnsSection";
import { CtaSection } from "@/components/result/CtaSection";
import { StickyActionBar } from "@/components/result/StickyActionBar";
import { InputPreviewPanel } from "@/components/result/InputPreviewPanel";

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { content, status, mutate } = useGeneratedContent(id);
  const [showInputPanel, setShowInputPanel] = useState(false);

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

  return (
    <div className="pb-24">
      <ResultHeader
        id={content.id}
        input={content.input}
        status={status}
        selectedStrategy={content.selectedStrategy}
        lastUsage={content.lastUsage}
      />
      <main className="mx-auto flex max-w-3xl flex-col gap-14 px-6 py-10">
        <StrategySection
          input={content.input}
          strategy={content.strategy}
          mutate={mutate}
        />
        <PdfSectionList input={content.input} pdf={content.pdf} mutate={mutate} />
        <LineMessagesSection input={content.input} line={content.line} mutate={mutate} />
        <SnsSection input={content.input} sns={content.sns} mutate={mutate} />
        <CtaSection input={content.input} cta={content.cta} mutate={mutate} />
      </main>
      <StickyActionBar
        content={content}
        status={status}
        onShowInput={() => setShowInputPanel(true)}
      />
      {showInputPanel ? (
        <InputPreviewPanel
          input={content.input}
          onClose={() => setShowInputPanel(false)}
        />
      ) : null}
    </div>
  );
}
