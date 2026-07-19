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
4. 使用モデルを変更したい場合のみ `ANTHROPIC_MODEL` を設定する（省略時は `claude-opus-4-8`。`lib/ai/config.ts` で一元管理）

`ANTHROPIC_API_KEY` を設定しないまま「AIに相談する」を実行すると、画面にエラーメッセージが表示される（サーバーにAPIキーを直接書き込む必要はなく、クライアントにも渡らない）。動作確認だけしたい場合は入力画面の「サンプルで確認する」から固定モックのコンテンツを確認できる。

## 開発ステップ

`docs/DESIGN.md` の「10. 開発ステップ」に沿って STEP1〜STEP6 の順に実装する。

- STEP1: Next.js初期構築と入力画面
- STEP2: 固定データによる生成結果画面
- STEP3: Claude API接続 ← 現在ここ
- STEP4: 編集・再生成・コピー機能
- STEP5: PDFテンプレート作成
- STEP6: PDFプレビュー・ダウンロード

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form + Zod / Anthropic Claude API (`claude-opus-4-8`、Structured Outputs) / Puppeteer（PDF生成、STEP5以降）
