"use client";

import type { GeneratedContent, MarketingStrategy } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

type StrategyField = {
  key: keyof MarketingStrategy;
  label: string;
};

const FIELDS: StrategyField[] = [
  { key: "targetProfile", label: "想定ターゲット" },
  { key: "targetPain", label: "ターゲットの主な悩み" },
  { key: "offerValue", label: "特典で提供する価値" },
  { key: "coreMessage", label: "中心となる訴求" },
  { key: "desiredAction", label: "読後に取ってほしい行動" },
  { key: "tone", label: "文章全体のトーン" },
];

export function StrategySection({
  strategy,
  mutate,
}: {
  strategy: MarketingStrategy;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const handleChange = (key: keyof MarketingStrategy, value: string) => {
    mutate((prev) => ({
      ...prev,
      strategy: { ...prev.strategy, [key]: value },
    }));
  };

  return (
    <section>
      <SectionHeading
        index={1}
        title="マーケティング戦略"
        description="このテーマをどう届けるかの土台。STEP3以降はここがClaude APIの提案に置き換わります。"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label
            key={field.key}
            className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <span className="text-xs font-bold text-neutral-500">
              {field.label}
            </span>
            <textarea
              className="min-h-20 resize-y rounded-lg border border-transparent bg-transparent p-0 text-[15px] leading-relaxed text-neutral-900 outline-none focus:border-neutral-200 focus:bg-neutral-50 focus:p-2"
              value={strategy[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
