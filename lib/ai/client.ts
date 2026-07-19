import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import { buildMadanaiSystemPrompt } from "./madanai-system-prompt";
import { buildGenerationUserPrompt } from "./prompt";
import { generatedContentAiSchema, type GeneratedContentAiOutput } from "./schema";
import type { ContentInput } from "@/lib/types";

export type GenerationErrorCode =
  | "missing_api_key"
  | "network"
  | "rate_limited"
  | "api_error"
  | "refusal"
  | "parse_failed";

export class GenerationError extends Error {
  code: GenerationErrorCode;

  constructor(code: GenerationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GenerationError";
    this.code = code;
  }
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError(
      "missing_api_key",
      "ANTHROPIC_API_KEY is not set",
    );
  }
  return new Anthropic({ apiKey });
}

/**
 * SDKの例外をGenerationErrorへ分類する。
 * APIキーやレスポンス全文はログへ残さず、種別のみを扱う。
 */
function classifyError(error: unknown): GenerationError {
  if (error instanceof GenerationError) return error;

  if (error instanceof Anthropic.AuthenticationError) {
    return new GenerationError("missing_api_key", "authentication failed", { cause: error });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new GenerationError("rate_limited", "rate limited", { cause: error });
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new GenerationError("network", "connection failed", { cause: error });
  }
  if (error instanceof Anthropic.APIError) {
    return new GenerationError("api_error", error.message, { cause: error });
  }
  return new GenerationError(
    "api_error",
    error instanceof Error ? error.message : "unknown error",
    { cause: error },
  );
}

const MAX_ATTEMPTS = 2;

/**
 * 入力内容からClaude APIを呼び出し、GeneratedContentの
 * strategy/pdf/line/sns/cta部分を生成する。
 * 検証失敗時は最大2回まで試行する（無限再試行はしない）。
 */
export async function generateContentFromAi(
  input: ContentInput,
): Promise<GeneratedContentAiOutput> {
  const client = getClient();
  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model: AI_CONFIG.model,
          max_tokens: AI_CONFIG.maxOutputTokens,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effort,
            format: zodOutputFormat(generatedContentAiSchema),
          },
          system: buildMadanaiSystemPrompt(),
          messages: [{ role: "user", content: buildGenerationUserPrompt(input) }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "generation refused");
      }
      if (!response.parsed_output) {
        throw new GenerationError("parse_failed", "structured output did not validate");
      }
      return response.parsed_output;
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      // APIキー未設定は再試行しても解決しないため即座に打ち切る
      if (classified.code === "missing_api_key") throw classified;
    }
  }

  throw lastError ?? new GenerationError("api_error", "generation failed");
}
