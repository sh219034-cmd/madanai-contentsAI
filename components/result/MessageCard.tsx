"use client";

import { CopyButton } from "./CopyButton";
import { RegenerateButton } from "./RegenerateButton";

export function MessageCard({
  title,
  badge,
  value,
  onChange,
  minHeight = "min-h-32",
}: {
  title: string;
  badge?: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-800">{title}</span>
          {badge ? (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-500">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          {value.length}文字
        </span>
      </div>
      <textarea
        className={`mb-3 w-full resize-y whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[14.5px] leading-relaxed text-neutral-800 outline-none focus:border-neutral-300 ${minHeight}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <CopyButton text={value} />
        <RegenerateButton />
      </div>
    </div>
  );
}
