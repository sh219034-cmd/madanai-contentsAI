import type { ConsultSummary } from "@/lib/types";

const SUMMARY_FIELDS: { key: keyof ConsultSummary; label: string }[] = [
  { key: "target", label: "ターゲット" },
  { key: "usp", label: "USP" },
  { key: "benefit", label: "ベネフィット" },
  { key: "evidence", label: "根拠" },
  { key: "purpose", label: "目的" },
  { key: "cta", label: "CTA" },
];

/** AIが理解した内容の最終まとめ。戦略提案へ進む前にユーザーへ確認表示する。 */
export function ConsultSummaryCard({ summary }: { summary: ConsultSummary }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/40 p-5">
      <p className="text-[12px] font-bold text-fuchsia-600">AIが理解した内容</p>
      <dl className="flex flex-col gap-3">
        {SUMMARY_FIELDS.map((field) => (
          <div key={field.key}>
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
              {field.label}
            </dt>
            <dd className="mt-0.5 text-[13.5px] leading-relaxed text-neutral-800">{summary[field.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
