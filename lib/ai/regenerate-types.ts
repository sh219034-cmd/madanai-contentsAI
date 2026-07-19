import { z } from "zod";
import { contentInputSchema } from "@/lib/schema";
import { aiPdfSectionTypeSchema } from "./schema";

export const regenerateKindSchema = z.enum([
  "strategyField",
  "pdfSection",
  "lineMessage",
  "threadsPost",
  "instagramPost",
  "instagramHashtags",
  "imagePrompt",
  "ctaField",
]);

export type RegenerateKind = z.infer<typeof regenerateKindSchema>;

const pdfSectionCurrentSchema = z.object({
  type: aiPdfSectionTypeSchema.optional(),
  title: z.string().max(200),
  body: z.string().max(3000),
  items: z.array(z.string().max(300)).max(40),
});

export const regenerateRequestSchema = z.object({
  input: contentInputSchema,
  kind: regenerateKindSchema,
  // 画面に表示されているラベル（例：「本文2」「Threads投稿（共感型）」）。
  // AIへの文脈提示に使う。
  label: z.string().min(1).max(80),
  current: z.union([
    z.string().max(3000),
    z.array(z.string().max(300)).max(40),
    pdfSectionCurrentSchema,
  ]),
  instruction: z.string().max(200).optional(),
});

export type RegenerateRequest = z.infer<typeof regenerateRequestSchema>;
