import type { PerformanceRecord } from "@/lib/types";
import { PERFORMANCE_CHANNEL_LABEL } from "@/lib/performance-labels";
import { calculatePerformanceRates, formatRatePercent } from "@/lib/performance-metrics";

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
      {label} {value}
    </span>
  );
}

export function PerformanceCard({
  record,
  selectable,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onReview,
}: {
  record: PerformanceRecord;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReview: () => void;
}) {
  const rates = calculatePerformanceRates(record.metrics);
  const { metrics } = record;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 transition ${
        selected ? "border-fuchsia-300 bg-fuchsia-50/40" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {selectable ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label="比較対象として選択"
              className="h-4 w-4 accent-fuchsia-500"
            />
          ) : null}
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-500">
            {PERFORMANCE_CHANNEL_LABEL[record.channel]}
          </span>
        </div>
        <span className="text-[11px] text-neutral-400">{formatDate(record.publishedAt)} 公開</span>
      </div>

      <div>
        <h3 className="text-[15px] font-extrabold leading-snug text-neutral-900">{record.title}</h3>
        {record.strategyName ? (
          <p className="mt-1 text-[12px] text-neutral-500">
            <span className="font-bold text-neutral-400">選択した戦略: </span>
            {record.strategyName}
          </p>
        ) : null}
        {record.target ? <p className="mt-0.5 text-[12px] text-neutral-500">{record.target}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {metrics.impressions !== undefined ? (
          <MetricChip label="表示回数" value={`${metrics.impressions}`} />
        ) : null}
        {metrics.reach !== undefined ? <MetricChip label="リーチ" value={`${metrics.reach}`} /> : null}
        {rates.engagementRate !== undefined ? (
          <MetricChip label="反応率" value={formatRatePercent(rates.engagementRate)} />
        ) : null}
        {rates.clickRate !== undefined ? (
          <MetricChip label="クリック率" value={formatRatePercent(rates.clickRate)} />
        ) : null}
        <MetricChip label="問い合わせ" value={metrics.inquiries !== undefined ? `${metrics.inquiries}件` : "-"} />
        <MetricChip label="契約" value={metrics.contracts !== undefined ? `${metrics.contracts}件` : "-"} />
        <MetricChip
          label="売上"
          value={metrics.revenue !== undefined ? `¥${metrics.revenue.toLocaleString()}` : "-"}
        />
      </div>

      {record.notes ? (
        <p className="whitespace-pre-wrap rounded-lg bg-neutral-50 px-3 py-2 text-[12px] leading-relaxed text-neutral-600">
          {record.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-neutral-600 transition hover:border-neutral-300"
        >
          編集
        </button>
        <button
          type="button"
          onClick={onReview}
          className="rounded-lg border border-fuchsia-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-fuchsia-600 transition hover:border-fuchsia-300"
        >
          AIに振り返りを依頼
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-rose-500 transition hover:border-rose-300"
        >
          削除
        </button>
      </div>
    </div>
  );
}
