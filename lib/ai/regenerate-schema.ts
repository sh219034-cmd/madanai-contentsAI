import { z } from "zod";
import { aiPdfSectionTypeSchema } from "./schema";

export const regenerateTextSchema = z.object({
  text: z.string(),
});

export const regeneratePdfSectionSchema = z.object({
  type: aiPdfSectionTypeSchema.optional(),
  title: z.string(),
  body: z.string(),
  items: z.array(z.string()),
});

export const regenerateHashtagsSchema = z.object({
  hashtags: z.array(z.string()).min(3).max(12),
});

export type RegenerateTextOutput = z.infer<typeof regenerateTextSchema>;
export type RegeneratePdfSectionOutput = z.infer<typeof regeneratePdfSectionSchema>;
export type RegenerateHashtagsOutput = z.infer<typeof regenerateHashtagsSchema>;
