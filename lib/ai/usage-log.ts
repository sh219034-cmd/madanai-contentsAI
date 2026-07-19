import "server-only";
import { estimateCostUsd } from "./pricing";

export type GenerationProcessType = "generate" | "regenerate";

export type UsageSummary = {
  model: string;
  processType: GenerationProcessType;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number | null;
};

/**
 * トークン使用量・概算費用のみをサーバーログへ記録する。
 * APIキー・入力本文・生成本文は一切ログへ出さない。
 */
export function recordUsage(params: {
  model: string;
  processType: GenerationProcessType;
  inputTokens: number;
  outputTokens: number;
}): UsageSummary {
  const summary: UsageSummary = {
    ...params,
    estimatedCostUsd: estimateCostUsd(params.model, params.inputTokens, params.outputTokens),
  };

  console.info(
    `[ai-usage] model=${summary.model} process=${summary.processType} ` +
      `input_tokens=${summary.inputTokens} output_tokens=${summary.outputTokens} ` +
      `estimated_cost_usd=${summary.estimatedCostUsd !== null ? summary.estimatedCostUsd.toFixed(4) : "unknown"}`,
  );

  return summary;
}
