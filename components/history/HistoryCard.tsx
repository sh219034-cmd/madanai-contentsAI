import Link from "next/link";
import type { HistoryItem, HistoryStatus } from "@/lib/types";

const STATUS_LABEL: Record<HistoryStatus, string> = {
  "strategy-only": "戦略分析のみ",
  generated: "コンテンツ生成済み",
  duplicate: "別案",
  sample: "サンプル",
};

const STATUS_STYLE: Record<HistoryStatus, string> = {
  "strategy-only": "bg-neutral-100 text-neutral-500",
  generated: "bg-emerald-50 text-emerald-600",
  duplicate: "bg-fuchsia-50 text-fuchsia-600",
  sample: "bg-amber-50 text-amber-600",
};

function formatDateTime(iso: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-neutral-600 transition hover:border-neutral-300"
    >
      {children}
    </Link>
  );
}

function ActionButton({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-bold transition ${
        danger
          ? "border-rose-200 bg-white text-rose-500 hover:border-rose-300"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export function HistoryCard({
  item,
  onDuplicate,
  onDelete,
}: {
  item: HistoryItem;
  onDuplicate: (id: string) => void;
  onDelete: (item: HistoryItem) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
        <span className="font-mono text-[10.5px] text-neutral-400">{item.id}</span>
      </div>

      <div>
        <h3 className="text-[15px] font-extrabold leading-snug text-neutral-900">{item.theme || "（テーマ未設定）"}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{item.target}</p>
      </div>

      {item.selectedStrategyName ? (
        <p className="text-[12px] text-neutral-500">
          <span className="font-bold text-neutral-400">選択中の戦略: </span>
          {item.selectedStrategyName}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span>作成日時: {formatDateTime(item.createdAt)}</span>
        <span>更新日時: {formatDateTime(item.updatedAt)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {item.hasContent ? (
          <>
            <ActionLink href={`/result/${item.id}`}>生成結果を開く</ActionLink>
            <ActionLink href={`/result/${item.id}/pdf`}>PDFプレビュー</ActionLink>
            <ActionLink href={`/strategy/${item.id}`}>戦略を変更</ActionLink>
            <ActionButton onClick={() => onDuplicate(item.id)}>複製</ActionButton>
          </>
        ) : (
          <>
            <ActionLink href={`/strategy/${item.id}`}>戦略候補を見る</ActionLink>
            <ActionLink href={`/?editAnalysisId=${item.id}`}>入力を修正して再分析</ActionLink>
          </>
        )}
        <ActionButton danger onClick={() => onDelete(item)}>
          削除
        </ActionButton>
      </div>
    </div>
  );
}
