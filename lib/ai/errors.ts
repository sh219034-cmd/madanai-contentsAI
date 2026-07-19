import Anthropic from "@anthropic-ai/sdk";

/**
 * generateContentFromAi・analyzeStrategyWithAi・regenerateSectionWithAi で共通の
 * エラー分類。SDKの例外をGenerationErrorへ分類し、APIキーやレスポンス全文は
 * ログへ残さず種別のみを扱う。
 */
export type GenerationErrorCode =
  | "missing_api_key"
  | "invalid_model"
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

/**
 * NotFoundError（404）は「指定モデルIDが存在しない」ケースを含むため、
 * 他モデルへ自動的にフォールバックはせず、"invalid_model" として
 * 明確にエラー化する（設定ミスを気づかせずに別モデルへ切り替えると、
 * 意図しない費用・品質の変化が起きるため）。
 */
export function classifyError(error: unknown): GenerationError {
  if (error instanceof GenerationError) return error;

  if (error instanceof Anthropic.NotFoundError) {
    return new GenerationError("invalid_model", "model not found", { cause: error });
  }
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

export function getApiKeyOrThrow(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError("missing_api_key", "ANTHROPIC_API_KEY is not set");
  }
  return apiKey;
}
