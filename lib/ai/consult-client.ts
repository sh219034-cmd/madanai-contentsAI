import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import {
  buildConsultSystemPrompt,
  buildConsultUserPrompt,
  type ConsultQaHistoryEntry,
} from "./consult-prompt";
import { consultAiSchema, type ConsultAiOutput } from "./consult-schema";
import { recordUsage, type UsageSummary } from "./usage-log";
import { GenerationError, classifyError, getApiKeyOrThrow } from "./errors";
import type { ContentInput } from "@/lib/types";

export type ConsultResult = {
  output: ConsultAiOutput;
  usage: UsageSummary;
};

function getClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKeyOrThrow() });
}

const MAX_ATTEMPTS = 2;

/**
 * 入力内容とここまでのQ&A履歴から、戦略提案に十分な情報が揃っているか、
 * まだ追加で確認すべきことがあるかをClaude APIへ判断させる。
 * 戦略候補(analyzeStrategyWithAi)より前段の、情報収集のみを担うステップ。
 */
export async function consultWithAi(
  input: ContentInput,
  qaHistory: ConsultQaHistoryEntry[],
): Promise<ConsultResult> {
  const client = getClient();
  const model = AI_CONFIG.models.consult;
  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model,
          max_tokens: AI_CONFIG.consultMaxOutputTokens,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effortByPurpose.consult,
            format: zodOutputFormat(consultAiSchema),
          },
          system: buildConsultSystemPrompt(),
          messages: [{ role: "user", content: buildConsultUserPrompt(input, qaHistory) }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      const usage = recordUsage({
        model,
        processType: "consult",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "consult refused");
      }
      if (!response.parsed_output) {
        throw new GenerationError("parse_failed", "structured output did not validate");
      }
      return { output: response.parsed_output, usage };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      if (classified.code === "missing_api_key" || classified.code === "invalid_model") {
        throw classified;
      }
    }
  }

  throw lastError ?? new GenerationError("api_error", "consult failed");
}
