import { z } from "zod";
import { contentInputSchema } from "./schema";

/**
 * POST /api/consult のリクエストボディ検証用。
 * qaHistoryは「その時点で回答済みの質問」のみを送る（未回答の質問は
 * クライアント側の状態にとどまり、サーバーへは送らない）。
 */
export const consultQaHistoryItemSchema = z.object({
  question: z.string().min(1).max(200),
  reason: z.string().min(1).max(200),
  answer: z.string().min(1).max(2000),
});

export const consultRequestSchema = z.object({
  input: contentInputSchema,
  qaHistory: z.array(consultQaHistoryItemSchema).max(30),
});
