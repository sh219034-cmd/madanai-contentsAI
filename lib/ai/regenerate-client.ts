import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_CONFIG } from "./config";
import { buildMadanaiSystemPrompt } from "./madanai-system-prompt";
import { buildRegenerateUserPrompt } from "./regenerate-prompt";
import {
  regenerateHashtagsSchema,
  regeneratePdfSectionSchema,
  regenerateTextSchema,
  type RegenerateHashtagsOutput,
  type RegeneratePdfSectionOutput,
  type RegenerateTextOutput,
} from "./regenerate-schema";
import type { RegenerateRequest } from "./regenerate-types";
import { GenerationError } from "./client";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError("missing_api_key", "ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

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

export type RegenerateResult =
  | { kind: "pdfSection"; result: RegeneratePdfSectionOutput }
  | { kind: "instagramHashtags"; result: RegenerateHashtagsOutput }
  | {
      kind: Exclude<RegenerateRequest["kind"], "pdfSection" | "instagramHashtags">;
      result: RegenerateTextOutput;
    };

const MAX_ATTEMPTS = 2;

export async function regenerateSectionWithAi(
  request: RegenerateRequest,
): Promise<RegenerateResult> {
  const client = getClient();
  const userPrompt = buildRegenerateUserPrompt({
    input: request.input,
    kind: request.kind,
    label: request.label,
    current: request.current,
    instruction: request.instruction,
  });

  const format =
    request.kind === "pdfSection"
      ? zodOutputFormat(regeneratePdfSectionSchema)
      : request.kind === "instagramHashtags"
        ? zodOutputFormat(regenerateHashtagsSchema)
        : zodOutputFormat(regenerateTextSchema);

  let lastError: GenerationError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse(
        {
          model: AI_CONFIG.model,
          max_tokens: 2000,
          thinking: { type: "adaptive" },
          output_config: {
            effort: AI_CONFIG.effort,
            format,
          },
          system: buildMadanaiSystemPrompt(),
          messages: [{ role: "user", content: userPrompt }],
        },
        { timeout: AI_CONFIG.requestTimeoutMs },
      );

      if (response.stop_reason === "refusal") {
        throw new GenerationError("refusal", "generation refused");
      }
      if (!response.parsed_output) {
        throw new GenerationError("parse_failed", "structured output did not validate");
      }

      if (request.kind === "pdfSection") {
        return {
          kind: "pdfSection",
          result: response.parsed_output as RegeneratePdfSectionOutput,
        };
      }
      if (request.kind === "instagramHashtags") {
        return {
          kind: "instagramHashtags",
          result: response.parsed_output as RegenerateHashtagsOutput,
        };
      }
      return {
        kind: request.kind,
        result: response.parsed_output as RegenerateTextOutput,
      };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      if (classified.code === "missing_api_key") throw classified;
    }
  }

  throw lastError ?? new GenerationError("api_error", "regeneration failed");
}
