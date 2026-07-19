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
import { GenerationError, classifyError, getApiKeyOrThrow } from "./errors";
import { recordUsage, type UsageSummary } from "./usage-log";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKeyOrThrow() });
}

export type RegenerateResult = {
  usage: UsageSummary;
} & (
  | { kind: "pdfSection"; result: RegeneratePdfSectionOutput }
  | { kind: "instagramHashtags"; result: RegenerateHashtagsOutput }
  | {
      kind: Exclude<RegenerateRequest["kind"], "pdfSection" | "instagramHashtags">;
      result: RegenerateTextOutput;
    }
);

const MAX_ATTEMPTS = 2;

export async function regenerateSectionWithAi(
  request: RegenerateRequest,
): Promise<RegenerateResult> {
  const client = getClient();
  const model = AI_CONFIG.models.regeneration;
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
          model,
          max_tokens: AI_CONFIG.regenerateMaxOutputTokens,
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

      const usage = recordUsage({
        model,
        processType: "regenerate",
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

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
          usage,
        };
      }
      if (request.kind === "instagramHashtags") {
        return {
          kind: "instagramHashtags",
          result: response.parsed_output as RegenerateHashtagsOutput,
          usage,
        };
      }
      return {
        kind: request.kind,
        result: response.parsed_output as RegenerateTextOutput,
        usage,
      };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      if (classified.code === "missing_api_key" || classified.code === "invalid_model") {
        throw classified;
      }
    }
  }

  throw lastError ?? new GenerationError("api_error", "regeneration failed");
}
