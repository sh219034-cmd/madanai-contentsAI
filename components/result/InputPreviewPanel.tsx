"use client";

import type { ContentInput } from "@/lib/types";

export function InputPreviewPanel({
  input,
  onClose,
}: {
  input: ContentInput;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">入力内容</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
          >
            閉じる
          </button>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-neutral-50 p-4 text-xs text-neutral-600">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
    </div>
  );
}
