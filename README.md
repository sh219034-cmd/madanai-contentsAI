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

`docs/DESIGN.md` の「10. 開発ステップ」がベースだが、実際の開発順序は以下のとおり進めている（APIキー未取得のためSTEP3の実通信確認のみ一時保留し、先にAPI不要のPDF機能を実装した）。

- STEP1: Next.js初期構築と入力画面
- STEP2: 固定データによる生成結果画面
- STEP3: Claude API接続（コード実装済み。実際のAPIキーでの実通信確認は**APIキー未取得のため保留中**）
- STEP4: 編集・再生成・コピー機能（実装済み）
- STEP4b: PDFテンプレート・プレビュー・ダウンロード・ブランドデザイン反映（実装済み。DESIGN.mdのSTEP5〜6に相当） ← 現在ここ

STEP3の実通信確認（実際のClaude APIを叩く検証）を除き、他の全機能は「サンプルで確認する」の固定モックコンテンツで動作確認できる。`/api/generate`・`/api/regenerate`など実API呼び出しのコード自体は変更しておらず、APIキーが用意され次第そのまま本番生成に切り替えられる。

## PDF機能（テンプレート・プレビュー・ダウンロード）

- `components/pdf/PdfDocument.tsx`: 唯一のPDFテンプレート。`GeneratedContent.pdf.sections`を受け取り、A4縦・白背景・黒文字・ピンク〜紫グラデーションのアクセント（マダナイブランド）でセクションごとに1ページとして描画する。ブラウザプレビュー（`/result/[id]/pdf`）で使用。
- `lib/pdf/render-html.ts`: `/api/pdf`がPlaywrightに渡すHTMLを生成する。**Next.js（App Router）はapp/配下から`react-dom/server`を静的importできない**制約があるため（`next build`時に検証済み）、PdfDocumentと同じCSS（`PDF_STYLES`）・同じセクションラベル（`lib/pdf/section-label.ts`）を使いながら、Reactを使わずプレーンな文字列テンプレートでHTMLを組み立てている。レイアウトを変更する際は両ファイルを合わせて更新する必要がある。
- `POST /api/pdf`: 受け取ったセクション配列をもとに上記HTMLを組み立て、Playwrightのheadless Chromiumで`page.pdf({ format: "A4", printBackground: true })`によりPDFバイナリを生成して返す。データは保存せず、リクエストごとに使い捨てる。
- チェックリストなど1セクションの内容が1ページに収まらない場合は、印刷CSS（`break-after: page`など）による自然な折り返しで自動的に次ページへ続く（内容が途中で切れることはない）。ただしページ番号「n / 合計」は論理セクション数（PdfSectionの数）を基準にしており、折り返しで物理ページ数が増えた場合は表示上のページ番号と実際のPDFページ数が一致しないことがある（既知の制約・MVPでは許容）。

### PDF生成ライブラリについて（Puppeteer→Playwrightへ変更）

`docs/DESIGN.md`ではPuppeteerを想定していたが、実装時にPlaywright（`playwright`パッケージ、`page.pdf()`）へ変更した。理由は、開発サンドボックスにPlaywright用のChromiumが既にプリインストールされており、Puppeteer用に別途ブラウザバイナリをダウンロードする必要がなかったため。機能的な違いはなく、`page.pdf()`はPuppeteerの同名APIとほぼ同等。開発環境でPlaywrightにバンドルされたChromiumのバージョンが合わない場合は、`.env.local`の`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`で実行ファイルを直接指定できる（本番デプロイでは通常未設定でよい）。

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form + Zod / Anthropic Claude API（`claude-sonnet-5`を既定、Structured Outputs） / Playwright（PDF生成）
