import type { ConsultQaItem, ConsultSummary } from "@/lib/types";
import type { ConsultAiOutput } from "./consult-schema";

export type ConsultRoundResult = {
  qaItems: ConsultQaItem[];
  status: "in-progress" | "ready";
  summary?: ConsultSummary;
};

/**
 * Claude APIのコンサル判断結果を、チャットに積み上げていくConsultQaItem[]へ
 * 反映する。isSufficient=trueのとき、またはquestionsが空配列で返ってきた
 * とき（AIが追加質問を作らなかった場合、そのまま会話を止められないため
 * 防御的に「十分」として扱う）は、その時点のsummaryを最終まとめとして採用する。
 */
export function appendConsultRoundFromAi(
  sessionId: string,
  existingQaItems: ConsultQaItem[],
  ai: ConsultAiOutput,
): ConsultRoundResult {
  if (ai.isSufficient || ai.questions.length === 0) {
    return { qaItems: existingQaItems, status: "ready", summary: ai.summary };
  }

  const newItems: ConsultQaItem[] = ai.questions.map((q, index) => ({
    id: `${sessionId}-q-${existingQaItems.length + index}`,
    question: q.question,
    reason: q.reason,
  }));

  return { qaItems: [...existingQaItems, ...newItems], status: "in-progress" };
}
