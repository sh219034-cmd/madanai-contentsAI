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
    // 成果記録1件のAI振り返り（POST /api/performance-review）
    performanceReview: resolveModel(process.env.ANTHROPIC_PERFORMANCE_REVIEW_MODEL, "claude-sonnet-5"),
    // AIマーケティングコンサルモード（POST /api/consult、戦略提案前の質問生成）
    consult: resolveModel(process.env.ANTHROPIC_CONSULT_MODEL, "claude-sonnet-5"),
  },
  // 特典PDF13セクション＋LINE3文＋SNS投稿＋CTA5項目をJSONのみで返す想定。
  maxOutputTokens: 8000,
  // 部分再生成は対象1件のみのため出力上限を小さくする。
  regenerateMaxOutputTokens: 2000,
  // 戦略候補5〜9件分（各案は短文フィールドのみ）のため中程度で足りる。
  strategyMaxOutputTokens: 4000,
  // AI振り返りは5項目×数個の短文リストのみのため小さめで足りる。
  performanceReviewMaxOutputTokens: 2000,
  // 質問0〜3問+6項目の理解サマリーのみのため小さめで足りる。
  consultMaxOutputTokens: 1500,
  /**
   * 用途別の思考の深さ（'low'|'medium'|'high'|'xhigh'|'max'、
   * @anthropic-ai/sdk の型定義で確認済み）。
   * 戦略分析・コンテンツ生成は「AIマーケティング責任者」としての深い分析
   * （ターゲット詳細・認知段階・競合分析・USP・ベネフィット・根拠・CTA設計、
   * 生成前レビュー・セルフレビューを経てから出力する）を内部で行うため、
   * mediumからhighへ引き上げ、思考時間の増加を許容する。
   * 部分再生成は1項目のみの小さな修正のためmediumのまま据え置く。
   */
  effortByPurpose: {
    generation: "high" as const,
    strategy: "high" as const,
    regeneration: "medium" as const,
    // 成果記録1件の振り返りのみで比較検討タスクではないため、mediumで十分とする。
    performanceReview: "medium" as const,
    // 質問すべきか・十分かの判断のみで、戦略の練り込み自体は行わないためmediumで十分とする。
    // ラウンドごとに複数回呼び出されるため、レスポンス速度も考慮する。
    consult: "medium" as const,
  },
  // サーバーレス関数のタイムアウトより十分短く、かつAPIの遅延に耐えられる値。
  requestTimeoutMs: 55_000,
} as const;
