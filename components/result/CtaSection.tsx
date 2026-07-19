"use client";

import type { ContentInput, CtaInfo, GeneratedContent } from "@/lib/types";
import { callRegenerateApi } from "@/lib/ai/regenerate-api-client";
import { CopyButton } from "./CopyButton";
import { RegenerateButton } from "./RegenerateButton";
import { SectionHeading } from "./SectionHeading";

const FIELDS: { key: keyof CtaInfo; label: string }[] = [
  { key: "pdfCta", label: "PDF内CTA" },
  { key: "lineCta", label: "LINE配信のCTA" },
  { key: "snsCta", label: "SNS投稿のCTA" },
  { key: "finalDestination", label: "最終誘導先" },
  { key: "googleFormCta", label: "Googleフォームへの誘導文" },
];

export function CtaSection({
  input,
  cta,
  mutate,
}: {
  input: ContentInput;
  cta: CtaInfo;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const handleChange = (key: keyof CtaInfo, value: string) => {
    mutate((prev) => ({ ...prev, cta: { ...prev.cta, [key]: value } }));
  };

  const handleRegenerate = async (
    key: keyof CtaInfo,
    label: string,
    instruction: string,
  ) => {
    const result = (await callRegenerateApi({
      input,
      kind: "ctaField",
      label,
      current: cta[key],
      instruction: instruction || undefined,
    })) as { text: string };
    handleChange(key, result.text);
  };

  return (
    <section>
      <SectionHeading
        index={5}
        title="CTA・導線設計"
        description="最終誘導先は入力画面の「最終的に誘導したい行動」を反映しています。"
      />
      <div className="flex flex-col gap-3">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-neutral-800">
                {field.label}
              </span>
              <CopyButton text={cta[field.key]} />
            </div>
            <textarea
              className="mb-3 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[14.5px] leading-relaxed text-neutral-800 outline-none focus:border-neutral-300"
              rows={2}
              value={cta[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
            <RegenerateButton
              onRegenerate={(instruction) =>
                handleRegenerate(field.key, field.label, instruction)
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
