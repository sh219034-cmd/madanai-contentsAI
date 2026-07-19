# マダナイ？ 特典コンテンツ作成ツール

マダナイのLINE登録特典PDFと、その集客用コンテンツ（LINE案内文・Threads・Instagram投稿文など）をテーマ入力から一括生成する社内専用ツール。設計の詳細は [`docs/DESIGN.md`](./docs/DESIGN.md) を参照。

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に ANTHROPIC_API_KEY を設定する
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くとコンテンツ入力画面が表示される。

### Claude APIキーの設定

1. [Anthropic Console](https://console.anthropic.com/) でAPIキーを発行する
2. リポジトリ直下の `.env.example` を `.env.local` としてコピーする
3. `.env.local` の `ANTHROPIC_API_KEY` に発行したキーを設定する（`.env.local` はGitにコミットされない）

`ANTHROPIC_API_KEY` を設定しないまま「AIに相談する」を実行すると、画面にエラーメッセージが表示される（サーバーにAPIキーを直接書き込む必要はなく、クライアントにも渡らない）。動作確認だけしたい場合は入力画面の「サンプルで確認する」から固定モックのコンテンツを確認できる。

### 使用モデル（用途別・コスト重視）

`lib/ai/config.ts` で一元管理し、コード内にモデル名を直接ハードコードしない。既定値はいずれも `@anthropic-ai/sdk`（インストール済みバージョンの型定義）と[Anthropic公式モデル一覧](https://platform.claude.com/docs/en/about-claude/models/overview)の両方で実在を確認済みのモデルID。

| 環境変数 | 用途 | 既定モデル | 理由 |
| --- | --- | --- | --- |
| `ANTHROPIC_GENERATION_MODEL` | 通常の一括生成（`POST /api/generate`） | `claude-sonnet-5` | コストと品質のバランスが良く、公式にも「speed and intelligenceの最良の組み合わせ」と位置づけられている |
| `ANTHROPIC_REGENERATION_MODEL` | 部分再生成（`POST /api/regenerate`） | `claude-sonnet-5` | 通常生成と同じ基準でよいため同一モデル |
| `ANTHROPIC_PREMIUM_MODEL` | 将来の「高品質モード」（ユーザーが明示的に選択した場合のみ想定。現時点ではUIから未使用） | `claude-opus-4-8` | 複雑なエージェント的タスク・エンタープライズ向けの最上位モデル |

全モデルでStructured Outputs（`client.messages.parse` + `zodOutputFormat`）に対応していることを公式ドキュメントで確認済み。

### トークン使用量・概算費用

`lib/ai/pricing.ts` に価格表（USD / 100万トークン）を集約している。生成・再生成のたびにサーバー側で `input_tokens` / `output_tokens` / 使用モデル / 概算費用をログに記録する（APIキー・入力本文・生成本文はログに残さない）。生成結果画面のヘッダーには直近の生成分の使用量が開発者向けに表示される。価格が変わった場合は `lib/ai/pricing.ts` のみ更新すればよい。

## 開発ステップ

`docs/DESIGN.md` の「10. 開発ステップ」に沿って STEP1〜STEP6 の順に実装する。

- STEP1: Next.js初期構築と入力画面
- STEP2: 固定データによる生成結果画面
- STEP3: Claude API接続（コード実装済み・実際のAPIキーでの実通信確認は未実施） ← 現在ここ
- STEP4: 編集・再生成・コピー機能
- STEP5: PDFテンプレート作成
- STEP6: PDFプレビュー・ダウンロード

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form + Zod / Anthropic Claude API（`claude-sonnet-5`を既定、Structured Outputs） / Puppeteer（PDF生成、STEP5以降）
