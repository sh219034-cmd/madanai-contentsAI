import type {
  ContentInput,
  GeneratedContent,
  GenerationUsage,
  StrategyCandidate,
  ThreadsPost,
} from "@/lib/types";
import type { GeneratedContentAiOutput } from "./schema";

/**
 * Claude APIの構造化出力からGeneratedContentを組み立てる。
 * id/createdAt/updatedAt/inputはアプリ側で付与する。
 * selectedStrategyは/strategy/[id]でユーザーが選んだ戦略候補のスナップショット。
 * originは「複製して別案を作る」から生成された場合に"duplicate"を渡す
 * （履歴画面(/history)の状態表示に使う）。
 */
export function buildGeneratedContentFromAi(
  id: string,
  input: ContentInput,
  ai: GeneratedContentAiOutput,
  selectedStrategy: StrategyCandidate,
  usage?: GenerationUsage,
  origin?: GeneratedContent["origin"],
): GeneratedContent {
  const now = new Date().toISOString();

  return {
    id,
    createdAt: now,
    updatedAt: now,
    input,
    selectedStrategy,
    origin,
    strategy: ai.strategy,
    pdf: {
      sections: ai.pdf.sections.map((section, index) => ({
        id: `${id}-pdf-${index}`,
        type: section.type,
        title: section.title,
        body: section.body,
        items: section.items.length > 0 ? section.items : undefined,
        order: index,
      })),
    },
    line: ai.line,
    sns: {
      threadsPosts: ai.sns.threadsPosts.map((post, index) => ({
        ...post,
        id: `${id}-threads-${index}`,
      })) as [ThreadsPost, ThreadsPost, ThreadsPost],
      instagramPost: ai.sns.instagramPost,
      instagramHashtags: ai.sns.instagramHashtags,
      imagePrompt: ai.sns.imagePrompt,
    },
    cta: ai.cta,
    lastUsage: usage,
  };
}
