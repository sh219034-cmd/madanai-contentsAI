import type { StrategyCandidate } from "@/lib/types";

export function StrategyChangeConfirmModal({
  candidate,
  onCancel,
  onDuplicate,
  onOverwrite,
}: {
  candidate: StrategyCandidate;
  onCancel: () => void;
  onDuplicate: () => void;
  onOverwrite: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-base font-extrabold text-neutral-900">
          「{candidate.name}」に変更しますか？
        </h2>
        <p className="mb-6 text-[13.5px] leading-relaxed text-neutral-600">
          戦略を変更すると、現在のPDF・LINE・SNS文章が新しい戦略に合わせて再生成されます。現在の編集内容は上書きされます。
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)]"
          >
            複製して別案を作る（推奨）
          </button>
          <button
            type="button"
            onClick={onOverwrite}
            className="rounded-xl border border-neutral-200 px-5 py-3 text-[13.5px] font-semibold text-neutral-600 transition hover:border-neutral-300"
          >
            現在の内容を上書きする
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2 text-[13px] font-semibold text-neutral-400 transition hover:text-neutral-600"
          >
            キャンセル
          </button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          「複製して別案を作る」を選ぶと、元の生成結果はそのまま残り、新しいコンテンツとして保存されます。
        </p>
      </div>
    </div>
  );
}
