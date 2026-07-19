# マダナイ？ 特典コンテンツ作成ツール

マダナイのLINE登録特典PDFと、その集客用コンテンツ（LINE案内文・Threads・Instagram投稿文など）をテーマ入力から一括生成する社内専用ツール。設計の詳細は [`docs/DESIGN.md`](./docs/DESIGN.md) を参照。

## セットアップ

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くとコンテンツ入力画面が表示される。

## 開発ステップ

`docs/DESIGN.md` の「10. 開発ステップ」に沿って STEP1〜STEP6 の順に実装する。

- STEP1: Next.js初期構築と入力画面 ← 現在ここ
- STEP2: 固定データによる生成結果画面
- STEP3: Claude API接続
- STEP4: 編集・再生成・コピー機能
- STEP5: PDFテンプレート作成
- STEP6: PDFプレビュー・ダウンロード

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form + Zod / Anthropic Claude API / Puppeteer（PDF生成、STEP5以降）
