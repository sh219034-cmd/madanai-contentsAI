"use client";

import type { GeneratedContent, SnsContent, ThreadsAngle } from "@/lib/types";
import { MessageCard } from "./MessageCard";
import { SectionHeading } from "./SectionHeading";

const ANGLE_LABEL: Record<ThreadsAngle, string> = {
  empathy: "共感型",
  problem: "問題提起型",
  knowhow: "ノウハウ型",
};

export function SnsSection({
  sns,
  mutate,
}: {
  sns: SnsContent;
  mutate: (updater: (prev: GeneratedContent) => GeneratedContent) => void;
}) {
  const handleThreadsChange = (id: string, value: string) => {
    mutate((prev) => ({
      ...prev,
      sns: {
        ...prev.sns,
        threadsPosts: prev.sns.threadsPosts.map((post) =>
          post.id === id ? { ...post, body: value } : post,
        ) as SnsContent["threadsPosts"],
      },
    }));
  };

  const handleInstagramChange = (value: string) => {
    mutate((prev) => ({
      ...prev,
      sns: { ...prev.sns, instagramPost: value },
    }));
  };

  const handleHashtagsChange = (value: string) => {
    const tags = value.split(/\s+/).filter(Boolean);
    mutate((prev) => ({
      ...prev,
      sns: { ...prev.sns, instagramHashtags: tags },
    }));
  };

  const handleImagePromptChange = (value: string) => {
    mutate((prev) => ({
      ...prev,
      sns: { ...prev.sns, imagePrompt: value },
    }));
  };

  return (
    <section>
      <SectionHeading
        index={4}
        title="SNS投稿"
        description="Threadsは訴求角度を変えた3案、Instagramは1案。画像生成用プロンプトも編集できます。"
      />
      <div className="flex flex-col gap-4">
        {sns.threadsPosts.map((post, index) => (
          <MessageCard
            key={post.id}
            title={`Threads投稿 案${index + 1}`}
            badge={ANGLE_LABEL[post.angle]}
            value={post.body}
            onChange={(v) => handleThreadsChange(post.id, v)}
          />
        ))}
        <MessageCard
          title="Instagram投稿文"
          value={sns.instagramPost}
          onChange={handleInstagramChange}
        />
        <MessageCard
          title="Instagramハッシュタグ"
          value={sns.instagramHashtags.join(" ")}
          onChange={handleHashtagsChange}
          minHeight="min-h-16"
        />
        <MessageCard
          title="画像生成用プロンプト"
          value={sns.imagePrompt}
          onChange={handleImagePromptChange}
        />
      </div>
    </section>
  );
}
