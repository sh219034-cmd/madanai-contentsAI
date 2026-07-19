import type { StrategyCandidate } from "@/lib/types";
import { StarRating } from "./StarRating";
import { ExpectedResponsePill } from "./ExpectedResponsePill";

export function StrategyCandidateCard({
  candidate,
  isSelected,
  selectLabel,
  onSelect,
}: {
  candidate: StrategyCandidate;
  isSelected: boolean;
  selectLabel: string;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
        isSelected ? "border-fuchsia-300 bg-fuchsia-50/40" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold text-neutral-900">{candidate.name}</span>
        <StarRating score={candidate.recommendationScore} />
      </div>

      <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-neutral-600">
        <p>
          <span className="font-bold text-neutral-500">狙う心理: </span>
          {candidate.targetPsychology}
        </p>
        <p>
          <span className="font-bold text-neutral-500">なぜ刺さりやすいか: </span>
          {candidate.whyItWorks}
        </p>
        <p>
          <span className="font-bold text-neutral-500">問い合わせにつながりやすいと考える理由: </span>
          {candidate.inquiryReason}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExpectedResponsePill level={candidate.expectedResponseLevel} />
        <span className="text-[11px] text-neutral-400">
          想定する構成: {candidate.contentFlow.join(" → ")}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="text-[13px] font-bold text-fuchsia-600 transition hover:text-fuchsia-700"
        >
          {selectLabel} →
        </button>
        {isSelected ? (
          <span className="text-xs font-bold text-emerald-600">✓ 選択中</span>
        ) : null}
      </div>
    </div>
  );
}
