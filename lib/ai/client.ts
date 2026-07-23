import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import { buildMadanaiSystemPrompt } from "./madanai-system-prompt";
import { buildGenerationUserPrompt } from "./prompt";
import { generatedContentAiSchema, type GeneratedContentAiOutput } from "./schema";
import { recordUsage, type UsageSummary } from "./usage-log";
import { GenerationError, classifyError, getApiKeyOrThrow } from "./errors";
import type { ContentInput, StrategyCandidate } from "@/lib/types";

export { GenerationError, type GenerationErrorCode } from "./errors";

export type GenerationResult = {
  output: GeneratedContentAiOutput;
  usage: UsageSummary;
};

function getClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKeyOrThrow() });
}

const MAX_ATTEMPTS = 2;

/**
 * 入力内容・選択済み戦略からClaude APIを呼び出し、GeneratedContentの
 * strategy(実行ブリーフ)/pdf/line/sns/cta部分を生成する。
 * strategyは/strategy/[id]でユーザーが選んだ候補を制約として渡すため、
 * ここでAIが戦略の切り口自体を自由に考え直すことはない。
 * 検証失敗時は最大2回まで試行する（無限再試行はしない）。
 */
export async function generateContentFromAi(
  input: ContentInput,
  strategy: StrategyCandidate,
): Promise<GenerationResult> {
  const client = getClient();
  const model = AI_CONFIG.models.generation;
  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model,
          max_tokens: AI_CONFIG.maxOutputTokens,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effortByPurpose.generation,
            format: zodOutputFormat(generatedContentAiSchema),
          },
          system: buildMadanaiSystemPrompt(),
          messages: [{ role: "user", content: buildGenerationUserPrompt(input, strategy) }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      const usage = recordUsage({
        model,
        processType: "generate",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "generation refused");
      }
      if (!response.parsed_output) {
        throw new GenerationError("parse_failed", "structured output did not validate");
      }
      return { output: response.parsed_output, usage };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      // APIキー未設定・モデルID不正は再試行しても解決しないため即座に打ち切る
      if (classified.code === "missing_api_key" || classified.code === "invalid_model") {
        throw classified;
      }
    }
  }

  throw lastError ?? new GenerationError("api_error", "generation failed");
}
