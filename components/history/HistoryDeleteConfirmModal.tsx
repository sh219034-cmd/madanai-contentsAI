import type { HistoryItem } from "@/lib/types";

export function HistoryDeleteConfirmModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: HistoryItem;
  onCancel: () => void;
  onConfirm: (options: { deleteContent: boolean; deleteAnalysis: boolean }) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-base font-extrabold text-neutral-900">
          このコンテンツを削除しますか？
        </h2>
        <p className="mb-6 text-[13.5px] leading-relaxed text-neutral-600">
          「{item.theme}」を削除します。削除すると元に戻せません。
        </p>
        <div className="flex flex-col gap-2.5">
          {item.hasContent ? (
            <>
              <button
                type="button"
                onClick={() => onConfirm({ deleteContent: true, deleteAnalysis: false })}
                className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)]"
              >
                生成結果だけ削除
              </button>
              <button
                type="button"
                onClick={() => onConfirm({ deleteContent: true, deleteAnalysis: true })}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-[13.5px] font-semibold text-rose-600 transition hover:border-rose-300"
              >
                分析結果もまとめて削除
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onConfirm({ deleteContent: false, deleteAnalysis: true })}
              className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-[13.5px] font-semibold text-rose-600 transition hover:border-rose-300"
            >
              削除する
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2 text-[13px] font-semibold text-neutral-400 transition hover:text-neutral-600"
          >
            キャンセル
          </button>
        </div>
        {item.hasContent ? (
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
            「生成結果だけ削除」を選ぶと、分析済みの戦略候補は残り、いつでも戦略選択からやり直せます。
          </p>
        ) : null}
      </div>
    </div>
  );
}
