import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import { buildStrategySystemPrompt, buildStrategyUserPrompt } from "./strategy-prompt";
import { strategyAnalysisAiSchema, type StrategyAnalysisAiOutput } from "./strategy-schema";
import { recordUsage, type UsageSummary } from "./usage-log";
import { GenerationError, classifyError, getApiKeyOrThrow } from "./errors";
import type { ContentInput } from "@/lib/types";

export type StrategyAnalysisResult = {
  output: StrategyAnalysisAiOutput;
  usage: UsageSummary;
};

function getClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKeyOrThrow() });
}

const MAX_ATTEMPTS = 2;

/**
 * 入力内容からClaude APIを呼び出し、戦略候補(最低5件)を分析・提案する。
 * これはコンテンツ生成(generateContentFromAi)より前段のステップで、
 * ここではまだPDF/LINE/SNS文章は生成しない。
 */
export async function analyzeStrategyWithAi(
  input: ContentInput,
): Promise<StrategyAnalysisResult> {
  const client = getClient();
  const model = AI_CONFIG.models.strategy;
  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model,
          max_tokens: AI_CONFIG.strategyMaxOutputTokens,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effort,
            format: zodOutputFormat(strategyAnalysisAiSchema),
          },
          system: buildStrategySystemPrompt(),
          messages: [{ role: "user", content: buildStrategyUserPrompt(input) }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      const usage = recordUsage({
        model,
        processType: "strategy",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "strategy analysis refused");
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

  throw lastError ?? new GenerationError("api_error", "strategy analysis failed");
}
