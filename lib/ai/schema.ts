import { z } from "zod";

/**
 * Claude APIの構造化出力（Structured Outputs）で強制するスキーマ。
 * GeneratedContent型のうち strategy/pdf/line/sns/cta のみを対象とする。
 * id/createdAt/updatedAt/input はアプリ側で付与する。
 */

export const aiPdfSectionTypeSchema = z.enum([
  "cover",
  "subtitle",
  "intro",
  "toc",
  "body",
  "checklist",
  "diagnosis",
  "summary",
  "cta",
]);

export const aiPdfSectionSchema = z.object({
  type: aiPdfSectionTypeSchema,
  title: z.string(),
  body: z.string(),
  // toc/checklist以外は空配列にする（optionalにせず常に配列で統一する）
  items: z.array(z.string()),
});

export const aiStrategySchema = z.object({
  targetProfile: z.string(),
  targetPain: z.string(),
  offerValue: z.string(),
  coreMessage: z.string(),
  desiredAction: z.string(),
  tone: z.string(),
});

export const aiThreadsPostSchema = z.object({
  angle: z.enum(["empathy", "problem", "knowhow"]),
  body: z.string(),
});

export const generatedContentAiSchema = z.object({
  strategy: aiStrategySchema,
  pdf: z.object({
    // cover/subtitle/intro/toc/body×複数/checklist/diagnosis/summary/cta
    sections: z.array(aiPdfSectionSchema).min(9).max(20),
  }),
  line: z.object({
    announcement: z.string(),
    delivery: z.string(),
    followUp: z.string(),
  }),
  sns: z.object({
    threadsPosts: z.array(aiThreadsPostSchema).length(3),
    instagramPost: z.string(),
    instagramHashtags: z.array(z.string()).min(3).max(12),
    imagePrompt: z.string(),
  }),
  cta: z.object({
    pdfCta: z.string(),
    lineCta: z.string(),
    snsCta: z.string(),
    finalDestination: z.string(),
    googleFormCta: z.string(),
  }),
});

export type GeneratedContentAiOutput = z.infer<typeof generatedContentAiSchema>;
