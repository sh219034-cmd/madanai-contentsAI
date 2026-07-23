import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import {
  buildPerformanceReviewSystemPrompt,
  buildPerformanceReviewUserPrompt,
} from "./performance-review-prompt";
import { performanceReviewAiSchema, type PerformanceReviewAiOutput } from "./performance-review-schema";
import { recordUsage, type UsageSummary } from "./usage-log";
import { GenerationError, classifyError, getApiKeyOrThrow } from "./errors";
import type { PerformanceRecord } from "@/lib/types";

export type PerformanceReviewResult = {
  output: PerformanceReviewAiOutput;
  usage: UsageSummary;
};

function getClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKeyOrThrow() });
}

const MAX_ATTEMPTS = 2;

/**
 * 成果記録1件をもとにClaude APIを呼び出し、振り返り(良かった要因/改善点/
 * 次回試すべき戦略/継続すべき要素/変えるべき要素)を生成する。
 * 他の成果記録・生成本文・個人情報はここでは一切送らない
 * （record自体に個人情報を含めない運用は入力フォーム側の責務）。
 */
export async function reviewPerformanceWithAi(
  record: PerformanceRecord,
): Promise<PerformanceReviewResult> {
  const client = getClient();
  const model = AI_CONFIG.models.performanceReview;
  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model,
          max_tokens: AI_CONFIG.performanceReviewMaxOutputTokens,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effortByPurpose.performanceReview,
            format: zodOutputFormat(performanceReviewAiSchema),
          },
          system: buildPerformanceReviewSystemPrompt(),
          messages: [{ role: "user", content: buildPerformanceReviewUserPrompt(record) }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      const usage = recordUsage({
        model,
        processType: "performance-review",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "performance review refused");
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

  throw lastError ?? new GenerationError("api_error", "performance review failed");
}
