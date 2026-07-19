"use client";

import { useState } from "react";

export function RegenerateButton({
  onRegenerate,
}: {
  onRegenerate: (instruction: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onRegenerate(instruction);
      setOpen(false);
      setInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "再生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
      >
        ↺ 再生成
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <label className="mb-2 block text-xs font-semibold text-neutral-600">
            追加の指示（任意）
          </label>
          <input
            className="mb-2 w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400"
            placeholder="例）もっと初心者向けに"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={loading}
          />
          {error ? (
            <p className="mb-2 text-[11px] font-medium text-rose-600">{error}</p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-600"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "再生成中..." : "再生成する"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
