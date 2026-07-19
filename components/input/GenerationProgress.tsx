const STAGES = [
  "入力内容を確認しています",
  "マーケティング戦略を設計しています",
  "特典コンテンツを作成しています",
  "LINE・SNS文章を作成しています",
  "最終調整しています",
];

export function GenerationProgress({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      {STAGES.map((label, index) => {
        const done = index < currentStage;
        const active = index === currentStage;
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] text-white"
                    : "bg-neutral-200 text-neutral-400"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span
              className={`text-sm ${
                active
                  ? "font-semibold text-neutral-900"
                  : done
                    ? "text-neutral-500"
                    : "text-neutral-400"
              }`}
            >
              {label}
              {active ? (
                <span className="ml-1 inline-block animate-pulse">...</span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
