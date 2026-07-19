/**
 * Claude APIのモデル・生成パラメータをここに集約する。
 * モデル名はコード内の他の場所に直接書かない。
 *
 * モデルIDの実在確認（2026-07-19時点）:
 * - インストール済み @anthropic-ai/sdk (0.112.3) の型定義
 *   node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts の
 *   `export type Model = 'claude-sonnet-5' | ... | 'claude-opus-4-8' | ...`
 * - Anthropic公式ドキュメント
 *   https://platform.claude.com/docs/en/about-claude/models/overview
 * の両方で claude-opus-4-8 / claude-sonnet-5 / claude-sonnet-4-6 /
 * claude-haiku-4-5 が現行モデルとして確認できる。
 *
 * 用途別にモデルを分離し、通常生成・部分再生成はコストと品質のバランスが良い
 * Sonnet系（claude-sonnet-5）を既定とする。Opus系（claude-opus-4-8）は
 * 将来「高品質モード」をユーザーが明示的に選択した場合のみ使用する想定で
 * 設定だけを用意する（今回のUIからはまだ呼び出さない）。
 */

function resolveModel(envValue: string | undefined, fallback: string): string {
  return envValue?.trim() || fallback;
}

export const AI_CONFIG = {
  models: {
    // 通常の一括生成（POST /api/generate）
    generation: resolveModel(process.env.ANTHROPIC_GENERATION_MODEL, "claude-sonnet-5"),
    // 部分再生成（POST /api/regenerate）
    regeneration: resolveModel(process.env.ANTHROPIC_REGENERATION_MODEL, "claude-sonnet-5"),
    // AIマーケティング分析・戦略提案（POST /api/strategy）。比較検討タスクのため
    // 通常生成と分けて設定できるようにしておく（既定は同じSonnet系）。
    strategy: resolveModel(process.env.ANTHROPIC_STRATEGY_MODEL, "claude-sonnet-5"),
    // 将来の高品質モード用（現時点ではUIから未使用）
    premium: resolveModel(process.env.ANTHROPIC_PREMIUM_MODEL, "claude-opus-4-8"),
  },
  // 特典PDF13セクション＋LINE3文＋SNS投稿＋CTA5項目をJSONのみで返す想定。
  maxOutputTokens: 8000,
  // 部分再生成は対象1件のみのため出力上限を小さくする。
  regenerateMaxOutputTokens: 2000,
  // 戦略候補5〜9件分（各案は短文フィールドのみ）のため中程度で足りる。
  strategyMaxOutputTokens: 4000,
  // 定型フォーマットの構造化生成が中心のため high ではなく medium を既定にし、
  // 費用と応答速度のバランスを取る。
  effort: "medium" as const,
  // サーバーレス関数のタイムアウトより十分短く、かつAPIの遅延に耐えられる値。
  requestTimeoutMs: 55_000,
} as const;
