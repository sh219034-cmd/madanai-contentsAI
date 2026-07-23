import type { PerformanceRecord } from "@/lib/types";
import { calculatePerformanceRates, formatRatePercent } from "@/lib/performance-metrics";

function formatCount(value: number | undefined, unit = ""): string {
  return value !== undefined ? `${value.toLocaleString()}${unit}` : "-";
}

function formatRevenue(value: number | undefined): string {
  return value !== undefined ? `¥${value.toLocaleString()}` : "-";
}

/** /performance画面の簡易比較（最大2件）。グラフは持たず、比較表のみ。 */
export function PerformanceCompareTable({ records }: { records: PerformanceRecord[] }) {
  const rows: { label: string; values: string[] }[] = [
    { label: "戦略", values: records.map((r) => r.strategyName || "-") },
    { label: "ターゲット", values: records.map((r) => r.target || "-") },
    { label: "表示回数", values: records.map((r) => formatCount(r.metrics.impressions)) },
    {
      label: "反応率",
      values: records.map((r) => formatRatePercent(calculatePerformanceRates(r.metrics).engagementRate)),
    },
    {
      label: "クリック率",
      values: records.map((r) => formatRatePercent(calculatePerformanceRates(r.metrics).clickRate)),
    },
    { label: "問い合わせ数", values: records.map((r) => formatCount(r.metrics.inquiries, "件")) },
    {
      label: "問い合わせ率",
      values: records.map((r) => formatRatePercent(calculatePerformanceRates(r.metrics).inquiryRate)),
    },
    { label: "契約数", values: records.map((r) => formatCount(r.metrics.contracts, "件")) },
    {
      label: "成約率",
      values: records.map((r) => formatRatePercent(calculatePerformanceRates(r.metrics).conversionRate)),
    },
    { label: "売上", values: records.map((r) => formatRevenue(r.metrics.revenue)) },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-[12px] font-bold text-neutral-500">
        簡易比較（実データに基づく参考情報であり、成果を保証するものではありません）
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="border-b border-neutral-100 px-3 py-2 text-left text-neutral-400">項目</th>
              {records.map((r) => (
                <th key={r.id} className="border-b border-neutral-100 px-3 py-2 text-left font-extrabold text-neutral-800">
                  {r.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-b border-neutral-50 px-3 py-2 font-bold text-neutral-400">{row.label}</td>
                {row.values.map((value, i) => (
                  <td key={i} className="border-b border-neutral-50 px-3 py-2 text-neutral-700">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
