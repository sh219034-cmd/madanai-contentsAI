import Link from "next/link";
import type { ContentInput, GenerationUsage, StrategyCandidate } from "@/lib/types";
import type { SaveStatus } from "@/lib/hooks/useGeneratedContent";
import { StarRating } from "@/components/strategy/StarRating";
import { HistoryLink } from "@/components/history/HistoryLink";
import { SaveStatusBadge } from "./SaveStatusBadge";

function StrategyBadgeRow({ id, strategy }: { id: string; strategy: StrategyCandidate }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
      <span className="text-[11px] font-bold text-neutral-400">選択中の戦略</span>
      <span className="text-[13px] font-extrabold text-neutral-900">{strategy.name}</span>
      <StarRating score={strategy.recommendationScore} />
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/?sourceContentId=${id}`}
          className="text-[11px] font-semibold text-neutral-400 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-700"
        >
          入力を修正して再分析
        </Link>
        <Link
          href={`/strategy/${id}`}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-neutral-600 transition hover:border-neutral-300"
        >
          戦略を変更
        </Link>
      </div>
    </div>
  );
}

function UsageDebugLine({ usage }: { usage: GenerationUsage }) {
  const cost =
    usage.estimatedCostUsd !== null && usage.estimatedCostUsd !== undefined
      ? `$${usage.estimatedCostUsd.toFixed(4)}`
      : "不明";
  return (
    <p className="rounded-lg bg-neutral-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-400">
      使用モデル: {usage.model} / 入力: {usage.inputTokens.toLocaleString()} tokens / 出力:{" "}
      {usage.outputTokens.toLocaleString()} tokens / 概算費用: {cost}
      （開発者向け表示・直近のAI呼び出し分のみ）
    </p>
  );
}

export function ResultHeader({
  id,
  input,
  status,
  selectedStrategy,
  lastUsage,
}: {
  id: string;
  input: ContentInput;
  status: SaveStatus;
  selectedStrategy: StrategyCandidate;
  lastUsage?: GenerationUsage;
}) {
  return (
    <header className="border-b border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800"
          >
            ← 入力画面へ戻る
          </Link>
          <div className="flex items-center gap-3">
            <HistoryLink />
            <SaveStatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
            コンテンツテーマ
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            {input.theme}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              ターゲット
            </span>
            <p className="text-sm leading-6 text-neutral-700">
              {input.target}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              特典の目的
            </span>
            <p className="text-sm leading-6 text-neutral-700">
              {input.offerGoal}
            </p>
          </div>
        </div>
        <StrategyBadgeRow id={id} strategy={selectedStrategy} />
        {lastUsage ? <UsageDebugLine usage={lastUsage} /> : null}
      </div>
    </header>
  );
}
