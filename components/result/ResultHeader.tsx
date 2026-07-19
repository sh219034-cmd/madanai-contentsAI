import Link from "next/link";
import type { ContentInput } from "@/lib/types";
import type { SaveStatus } from "@/lib/hooks/useGeneratedContent";
import { SaveStatusBadge } from "./SaveStatusBadge";

export function ResultHeader({
  input,
  status,
}: {
  input: ContentInput;
  status: SaveStatus;
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
          <SaveStatusBadge status={status} />
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
      </div>
    </header>
  );
}
