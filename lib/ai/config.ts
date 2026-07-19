/**
 * Claude APIのモデル・生成パラメータをここに集約する。
 * モデル名はコード内の他の場所に直接書かない。
 *
 * デフォルトは claude-opus-4-8（2026-07時点でAnthropicが提供する
 * 最新かつ最も高性能なOpus系モデル）。ANTHROPIC_MODEL 環境変数で
 * 上書きできる。
 */
export const AI_CONFIG = {
  model: process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8",
  // 特典PDF13セクション＋LINE3文＋SNS投稿＋CTA5項目をJSONのみで返す想定。
  // 費用を抑えつつ十分な分量を確保できる値として設定。
  maxOutputTokens: 8000,
  // 定型フォーマットの構造化生成が中心のため high ではなく medium を既定にし、
  // 費用と応答速度のバランスを取る。
  effort: "medium" as const,
  // サーバーレス関数のタイムアウトより十分短く、かつAPIの遅延に耐えられる値。
  requestTimeoutMs: 55_000,
} as const;
