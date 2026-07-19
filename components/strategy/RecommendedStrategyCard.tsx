import type { StrategyCandidate } from "@/lib/types";
import { StarRating } from "./StarRating";
import { ExpectedResponsePill } from "./ExpectedResponsePill";

export function RecommendedStrategyCard({
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
    <div className="rounded-2xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] p-[2px]">
      <div className="rounded-[15px] bg-[linear-gradient(180deg,#fdf2ff,#ffffff_55%)] p-6 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-3 py-1 text-xs font-bold text-white">
            ★ AIのおすすめ戦略
          </span>
          <StarRating score={candidate.recommendationScore} size="lg" />
        </div>

        <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-neutral-900">
          {candidate.name}
        </h3>

        {candidate.recommendationReason ? (
          <p className="mb-5 text-[14.5px] leading-relaxed text-neutral-700">
            {candidate.recommendationReason}
          </p>
        ) : null}

        <div className="mb-5 rounded-xl border border-fuchsia-100 bg-white/70 p-4">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
            想定されるコンテンツの流れ
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13.5px] font-semibold text-neutral-800">
            {candidate.contentFlow.map((step, index) => (
              <span key={`${candidate.id}-flow-${index}`} className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[12.5px] text-white">
                  {step}
                </span>
                {index < candidate.contentFlow.length - 1 ? (
                  <span className="text-neutral-300">→</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">
              狙う心理
            </span>
            <p className="text-[13.5px] leading-relaxed text-neutral-700">
              {candidate.targetPsychology}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">
              なぜ刺さりやすいか
            </span>
            <p className="text-[13.5px] leading-relaxed text-neutral-700">
              {candidate.whyItWorks}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">
              反応の期待度
            </span>
            <ExpectedResponsePill level={candidate.expectedResponseLevel} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">
              問い合わせにつながりやすいと考える理由
            </span>
            <p className="text-[13.5px] leading-relaxed text-neutral-700">
              {candidate.inquiryReason}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)] transition"
          >
            {selectLabel}
          </button>
          {isSelected ? (
            <span className="text-xs font-bold text-emerald-600">✓ 選択中の戦略</span>
          ) : null}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
          ※ 反応の期待度・問い合わせにつながりやすいと考える理由は、入力内容と一般的なマーケティング傾向をもとにしたAIによる相対評価です。成果を保証するものではありません。
        </p>
      </div>
    </div>
  );
}
