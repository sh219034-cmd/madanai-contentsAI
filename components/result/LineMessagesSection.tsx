"use client";

import type { GeneratedContent, LineMessages } from "@/lib/types";
import { MessageCard } from "./MessageCard";
import { SectionHeading } from "./SectionHeading";

export function LineMessagesSection({
  line,
  mutate,
}: {
  line: LineMessages;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const handleChange = (key: keyof LineMessages, value: string) => {
    mutate((prev) => ({ ...prev, line: { ...prev.line, [key]: value } }));
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
          title="① 特典を案内する配信文"
          value={line.announcement}
          onChange={(v) => handleChange("announcement", v)}
        />
        <MessageCard
          title="② 特典を送付する際の文章"
          value={line.delivery}
          onChange={(v) => handleChange("delivery", v)}
        />
        <MessageCard
          title="③ 送付後のフォロー文章"
          value={line.followUp}
          onChange={(v) => handleChange("followUp", v)}
        />
      </div>
    </section>
  );
}
