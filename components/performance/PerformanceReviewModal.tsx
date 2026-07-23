"use client";

import { useState } from "react";
import type { PerformanceRecord } from "@/lib/types";
import type { PerformanceReviewAiOutput } from "@/lib/ai/performance-review-schema";

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[12.5px] font-extrabold text-neutral-700">{title}</h3>
      <ul className="flex flex-col gap-1 pl-4 text-[13px] leading-relaxed text-neutral-600">
        {items.map((item, i) => (
          <li key={i} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PerformanceReviewModal({
  record,
  onClose,
}: {
  record: PerformanceRecord;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PerformanceReviewAiOutput | null>(null);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    setErrorMessage(null);
    setRequested(true);
    try {
      const res = await fetch("/api/performance-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const json: { result?: PerformanceReviewAiOutput; message?: string } = await res.json();
      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "AI振り返りに失敗しました。");
      }
      setResult(json.result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "AIとの通信に失敗しました。時間を置いてもう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-[15px] font-extrabold text-neutral-900">AIに振り返りを依頼</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
          >
            閉じる
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <p className="text-[12px] leading-relaxed text-neutral-500">
            「{record.title}」の成果データをもとに振り返ります。過去の成果は参考情報であり、
            再現性や成果を保証するものではありません。
          </p>

          {!requested ? (
            <button
              type="button"
              onClick={handleRequest}
              className="w-fit rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-2.5 text-[13px] font-bold text-white"
            >
              振り返りを依頼する
            </button>
          ) : null}

          {loading ? <p className="text-sm text-neutral-400">AIが分析しています…</p> : null}

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {result ? (
            <div className="flex flex-col gap-4">
              <ReviewList title="良かった可能性がある要因" items={result.goodFactors} />
              <ReviewList title="改善できる点" items={result.improvementPoints} />
              <ReviewList title="次回試すべき戦略" items={result.nextStrategiesToTry} />
              <ReviewList title="継続すべき要素" items={result.thingsToContinue} />
              <ReviewList title="変えるべき要素" items={result.thingsToChange} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
