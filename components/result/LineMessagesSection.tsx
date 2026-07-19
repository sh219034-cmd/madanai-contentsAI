"use client";

import type { ContentInput, GeneratedContent, LineMessages } from "@/lib/types";
import { callRegenerateApi } from "@/lib/ai/regenerate-api-client";
import { MessageCard } from "./MessageCard";
import { SectionHeading } from "./SectionHeading";

const FIELD_LABELS: Record<keyof LineMessages, string> = {
  announcement: "① 特典を案内する配信文",
  delivery: "② 特典を送付する際の文章",
  followUp: "③ 送付後のフォロー文章",
};

export function LineMessagesSection({
  input,
  line,
  mutate,
}: {
  input: ContentInput;
  line: LineMessages;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const handleChange = (key: keyof LineMessages, value: string) => {
    mutate((prev) => ({ ...prev, line: { ...prev.line, [key]: value } }));
  };

  const handleRegenerate = async (key: keyof LineMessages, instruction: string) => {
    const result = (await callRegenerateApi({
      input,
      kind: "lineMessage",
      label: FIELD_LABELS[key],
      current: line[key],
      instruction: instruction || undefined,
    })) as { text: string };
    handleChange(key, result.text);
  };

  return (
    <section>
      <SectionHeading
        index={3}
        title="LINE配信用文章"
        description="改行はそのまま保持されます。LINEでの見え方を意識して編集してください。"
      />
      <div className="flex flex-col gap-4">
        <MessageCard
          title={FIELD_LABELS.announcement}
          value={line.announcement}
          onChange={(v) => handleChange("announcement", v)}
          onRegenerate={(instruction) => handleRegenerate("announcement", instruction)}
        />
        <MessageCard
          title={FIELD_LABELS.delivery}
          value={line.delivery}
          onChange={(v) => handleChange("delivery", v)}
          onRegenerate={(instruction) => handleRegenerate("delivery", instruction)}
        />
        <MessageCard
          title={FIELD_LABELS.followUp}
          value={line.followUp}
          onChange={(v) => handleChange("followUp", v)}
          onRegenerate={(instruction) => handleRegenerate("followUp", instruction)}
        />
      </div>
    </section>
  );
}
