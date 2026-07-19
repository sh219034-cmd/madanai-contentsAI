# マダナイ？ 特典コンテンツ作成ツール

マダナイ専属の「AIマーケティング担当者」として、テーマ入力からマーケティング戦略の分析・提案を行い、選んだ戦略に沿ってLINE登録特典PDFと集客用コンテンツ（LINE案内文・Threads・Instagram投稿文など）を一括生成する社内専用ツール。単なる文章生成ツールではなく、**文章を書く前にAIが戦略を比較検討して提案する**ことが最大の特徴。設計の詳細は [`docs/DESIGN.md`](./docs/DESIGN.md) を参照。

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

`ANTHROPIC_API_KEY` を設定しないまま「AIマーケティング担当者に相談する」を実行すると、画面にエラーメッセージが表示される（サーバーにAPIキーを直接書き込む必要はなく、クライアントにも渡らない）。動作確認だけしたい場合は入力画面の「サンプルで確認する」から、固定の戦略候補・生成結果を使って一連の操作を確認できる。

### 使用モデル（用途別・コスト重視）

`lib/ai/config.ts` で一元管理し、コード内にモデル名を直接ハードコードしない。既定値はいずれも `@anthropic-ai/sdk`（インストール済みバージョンの型定義）と[Anthropic公式モデル一覧](https://platform.claude.com/docs/en/about-claude/models/overview)の両方で実在を確認済みのモデルID。

| 環境変数 | 用途 | 既定モデル | 理由 |
| --- | --- | --- | --- |
| `ANTHROPIC_STRATEGY_MODEL` | AIマーケティング分析・戦略提案（`POST /api/strategy`） | `claude-sonnet-5` | 複数戦略の比較検討タスクのため、生成用と分けて設定できるようにしている（既定は同じSonnet系） |
| `ANTHROPIC_GENERATION_MODEL` | 選択済み戦略に沿った一括生成（`POST /api/generate`） | `claude-sonnet-5` | コストと品質のバランスが良く、公式にも「speed and intelligenceの最良の組み合わせ」と位置づけられている |
| `ANTHROPIC_REGENERATION_MODEL` | 部分再生成（`POST /api/regenerate`） | `claude-sonnet-5` | 通常生成と同じ基準でよいため同一モデル |
| `ANTHROPIC_PREMIUM_MODEL` | 将来の「高品質モード」（ユーザーが明示的に選択した場合のみ想定。現時点ではUIから未使用） | `claude-opus-4-8` | 複雑なエージェント的タスク・エンタープライズ向けの最上位モデル |

全モデルでStructured Outputs（`client.messages.parse` + `zodOutputFormat`）に対応していることを公式ドキュメントで確認済み。

### トークン使用量・概算費用

`lib/ai/pricing.ts` に価格表（USD / 100万トークン）を集約している。生成・再生成のたびにサーバー側で `input_tokens` / `output_tokens` / 使用モデル / 概算費用をログに記録する（APIキー・入力本文・生成本文はログに残さない）。生成結果画面のヘッダーには直近の生成分の使用量が開発者向けに表示される。価格が変わった場合は `lib/ai/pricing.ts` のみ更新すればよい。

## 開発ステップ

`docs/DESIGN.md` の「10. 開発ステップ」がベースだが、実際の開発順序は以下のとおり進めている（APIキー未取得のためSTEP3の実通信確認のみ一時保留している）。

- STEP1: Next.js初期構築と入力画面
- STEP2: 固定データによる生成結果画面
- STEP3: Claude API接続（コード実装済み。実際のAPIキーでの実通信確認は**APIキー未取得のため保留中**）
- STEP4: 編集・再生成・コピー機能（実装済み）
- STEP4b: PDFテンプレート・プレビュー・ダウンロード・ブランドデザイン反映（実装済み。DESIGN.mdのSTEP5〜6に相当）
- STEP4c: AIマーケティング分析・戦略提案機能（実装済み。単なる文章生成ツールではなく「AIマーケティング担当者」として設計） ← 現在ここ

STEP3の実通信確認（実際のClaude APIを叩く検証）を除き、他の全機能は「サンプルで確認する」の固定モックデータで動作確認できる。`/api/generate`・`/api/regenerate`・`/api/strategy`など実API呼び出しのコード自体はAPIキーの有無で分岐させておらず、APIキーが用意され次第そのまま本番利用に切り替えられる。

## AIマーケティング分析・戦略提案機能

文章を生成する前に、AIが入力内容を分析し、複数のマーケティング戦略を比較検討して提案する。ユーザーが戦略を選んで初めてPDF/LINE/SNS/CTAが生成される。

**画面遷移**: `/`（入力）→ `/strategy/[id]`（戦略提案・選択、新規画面）→ `/result/[id]`（生成結果・編集、戦略変更バッジを追加）→ `/result/[id]/pdf`（PDFプレビュー・ダウンロード）

- `POST /api/strategy`: 入力内容から戦略候補を最低5件、Structured Outputsで分析・提案する（`lib/ai/strategy-client.ts`）。候補は毎回同じ組み合わせを機械的に返すのではなく、入力内容に応じてAIが選ぶ。ちょうど1件だけ`isRecommended: true`になる（AI出力が崩れた場合の防御的な正規化を`lib/ai/build-strategy.ts`で行う）。
- 「反応の期待度」（旧: 想定CTR）は`低`/`中`/`高`/`非常に高い`の4段階の相対評価のみで表現し、具体的なパーセンテージや成果保証は一切出さない（マダナイのブランドルール：根拠のない数字・成果保証の禁止に準拠）。「問い合わせにつながりやすいと考える理由」も断定ではなく可能性としての表現にする。
- `POST /api/generate` は選択済みの戦略（`StrategyCandidate`）を制約としてリクエストに含める。AIは戦略の切り口自体を自由に考え直さず、選ばれた戦略に沿ってPDF/LINE/SNS/CTAを生成する。生成結果には`selectedStrategy`として選択時点の戦略のスナップショットを保存する。
- 戦略候補一覧（`StrategyAnalysis`）は`GeneratedContent`とは別のlocalStorageキー（`madanai:strategy-analyses`、`lib/strategy-storage.ts`）に保存し、「戦略を変更」時は再分析せず同じ候補一覧を再利用する。入力内容を変更して分析し直したい場合のみ、入力画面へ戻って再度分析する。
- 結果画面で「戦略を変更」→別候補を選ぶと、「複製して別案を作る（推奨・元の生成結果は保持される、新しいコンテンツIDで保存）」「現在の内容を上書きする」の確認ダイアログを表示する。

## PDF機能（テンプレート・プレビュー・ダウンロード）

- `components/pdf/PdfDocument.tsx`: 唯一のPDFテンプレート。`GeneratedContent.pdf.sections`を受け取り、A4縦・白背景・黒文字・ピンク〜紫グラデーションのアクセント（マダナイブランド）でセクションごとに1ページとして描画する。ブラウザプレビュー（`/result/[id]/pdf`）で使用。
- `lib/pdf/section-render-model.ts`: `PdfSection`を「どの型にどのフィールドを表示するか」まで正規化した`SectionRenderModel`に変換する共通ロジック（STEP F）。ブラウザプレビューとPDFダウンロードの両方がこの正規化済みデータを描画するだけの薄い実装で済むようにしている。
- `lib/pdf/render-html.ts`: `/api/pdf`がPlaywrightに渡すHTMLを生成する。**Next.js（App Router）はapp/配下から`react-dom/server`を静的importできない**制約があるため（`next build`時に検証済み）、PdfDocumentと同じCSS（`PDF_STYLES`）・同じセクションラベル（`lib/pdf/section-label.ts`）・同じ`buildSectionRenderModel`を使いながら、Reactを使わずプレーンな文字列テンプレートでHTMLを組み立てている。「どの型に何を表示するか」の判断は共通化済みのため、レイアウト変更時に二重で直す必要があるのは見た目のマークアップ（JSXとHTML文字列）だけ。詳細は下記「PDFアーキテクチャの選択」を参照。
- `POST /api/pdf`: 受け取ったセクション配列をもとに上記HTMLを組み立て、Playwrightのheadless Chromiumで`page.pdf({ format: "A4", printBackground: true })`によりPDFバイナリを生成して返す。データは保存せず、リクエストごとに使い捨てる。
- チェックリストなど1セクションの内容が1ページに収まらない場合は、印刷CSS（`break-after: page`など）による自然な折り返しで自動的に次ページへ続く（内容が途中で切れることはない）。ただしページ番号「n / 合計」は論理セクション数（PdfSectionの数）を基準にしており、折り返しで物理ページ数が増えた場合は表示上のページ番号と実際のPDFページ数が一致しないことがある（既知の制約・MVPでは許容）。

### PDFアーキテクチャの選択（React画面とPDFの二重管理をどこまで解消したか）

React画面（ブラウザプレビュー）とPDFダウンロード（Playwright）は、Next.js（App Router）が`app/`配下から`react-dom/server`の静的importを許可しない制約により、完全に同一のReactコンポーネントインスタンスを共有することはできない（`next build`時に実際に確認済み）。今回は以下の方式（A案）を採用した。

- **共通化した処理**: セクションの種別ごとに「どのフィールドをどう表示するか」を判断するロジック（`lib/pdf/section-render-model.ts`の`buildSectionRenderModel`）、セクションラベル（`lib/pdf/section-label.ts`）、CSS（`components/pdf/PdfDocument.tsx`の`PDF_STYLES`）。
- **まだ二重管理になっている箇所**: 正規化済みデータ（`SectionRenderModel`）を実際のマークアップに変換する最後の一段だけ — `components/pdf/PdfDocument.tsx`の`SectionByModel`（JSX）と`lib/pdf/render-html.ts`の`renderSectionByModel`（HTML文字列）。新しいセクション種別を追加する場合は、`SectionRenderModel`の型定義・`buildSectionRenderModel`・この2つの葉実装の計4箇所を変更する必要がある。色・余白・フォント・見出しなど既存セクションの見た目だけを変える場合は、共通CSS（`PDF_STYLES`）1箇所の変更で済む。
- **将来の選択肢（今回は未採用）**: PDFの変更頻度が高くなった場合、`/api/pdf`から`child_process`で別のNode実行ファイルを起動し、そちらで`PdfDocument.tsx`を`react-dom/server`でそのままレンダリングする方式（B案）が完全な単一ソース化を実現できる。ただし別プロセス起動のレイテンシ・TSXをビルドする仕組み・デバッグの複雑化という運用コストが増えるため、現在の規模では見合わないと判断し採用しなかった。検討記録として`docs/DESIGN.md`にも残している。

### PDF生成ライブラリについて（Puppeteer→Playwrightへ変更）

`docs/DESIGN.md`ではPuppeteerを想定していたが、実装時にPlaywright（`playwright`パッケージ、`page.pdf()`）へ変更した。理由は、開発サンドボックスにPlaywright用のChromiumが既にプリインストールされており、Puppeteer用に別途ブラウザバイナリをダウンロードする必要がなかったため。機能的な違いはなく、`page.pdf()`はPuppeteerの同名APIとほぼ同等。開発環境でPlaywrightにバンドルされたChromiumのバージョンが合わない場合は、`.env.local`の`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`で実行ファイルを直接指定できる（本番デプロイでは通常未設定でよい）。

## 技術スタック

Next.js (App Router) / TypeScript / Tailwind CSS / React Hook Form + Zod / Anthropic Claude API（`claude-sonnet-5`を既定、Structured Outputs） / Playwright（PDF生成）
