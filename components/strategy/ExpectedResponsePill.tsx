import type { ExpectedResponseLevel } from "@/lib/types";

const LEVEL_STYLE: Record<ExpectedResponseLevel, string> = {
  低: "bg-neutral-100 text-neutral-500",
  中: "bg-fuchsia-50 text-fuchsia-600",
  高: "bg-fuchsia-100 text-fuchsia-700",
  非常に高い: "bg-violet-100 text-violet-700",
};

export function ExpectedResponsePill({ level }: { level: ExpectedResponseLevel }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_STYLE[level]}`}
    >
      {level}
    </span>
  );
}
