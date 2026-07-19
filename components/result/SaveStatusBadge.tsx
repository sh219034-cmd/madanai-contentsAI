import type { SaveStatus } from "@/lib/hooks/useGeneratedContent";

const STATUS_MAP: Record<SaveStatus, { label: string; dot: string } | null> = {
  loading: { label: "読み込み中...", dot: "bg-neutral-300" },
  saving: { label: "保存中...", dot: "bg-amber-400" },
  saved: { label: "保存済み", dot: "bg-emerald-500" },
  "not-found": null,
};

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  const entry = STATUS_MAP[status];
  if (!entry) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
      <span className={`h-1.5 w-1.5 rounded-full ${entry.dot}`} />
      {entry.label}
    </span>
  );
}
