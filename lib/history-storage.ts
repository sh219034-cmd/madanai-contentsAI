import type { GeneratedContent, HistoryItem, HistoryStatus, StrategyAnalysis } from "./types";
import { getAllContents, getContentById, saveContent, deleteContent, generateContentId } from "./content-storage";
import { getAllStrategyAnalyses, deleteStrategyAnalysis, cloneStrategyAnalysisForNewId } from "./strategy-storage";

/**
 * 判定の優先順位: 固定モック由来(isMock)であれば、複製されたものであっても
 * 常に「サンプル」を優先して表示する。実データと紛れないようにする目的が
 * 「別案」表示より優先度が高いと判断したため（複製元がサンプルの場合、
 * 複製後も引き続き「サンプル」と表示される）。
 */
function resolveStatus(analysis: StrategyAnalysis | undefined, content: GeneratedContent | undefined): HistoryStatus {
  if (analysis?.isMock) return "sample";
  if (content?.origin === "duplicate") return "duplicate";
  if (content) return "generated";
  return "strategy-only";
}

/**
 * 履歴画面(/history)用に、StrategyAnalysisとGeneratedContentをidで
 * 突き合わせた統合ビューを組み立てる。localStorageの読み書きはこのファイルに
 * 集約し、コンポーネントから直接 madanai:strategy-analyses / madanai:contents
 * を操作しない。
 */
export function getHistoryItems(): HistoryItem[] {
  const analyses = getAllStrategyAnalyses();
  const contents = getAllContents();

  const ids = new Set<string>([...analyses.map((a) => a.id), ...contents.map((c) => c.id)]);

  const items: HistoryItem[] = [];
  for (const id of ids) {
    const analysis = analyses.find((a) => a.id === id);
    const content = contents.find((c) => c.id === id);
    if (!analysis && !content) continue;

    const theme = content?.input.theme ?? analysis?.input.theme ?? "";
    const target = content?.input.target ?? analysis?.input.target ?? "";
    const createdAt = content?.createdAt ?? analysis?.createdAt ?? "";
    const updatedAt = content?.updatedAt ?? analysis?.createdAt ?? createdAt;

    items.push({
      id,
      theme,
      target,
      createdAt,
      updatedAt,
      status: resolveStatus(analysis, content),
      selectedStrategyName: content?.selectedStrategy.name,
      hasAnalysis: Boolean(analysis),
      hasContent: Boolean(content),
    });
  }

  return items;
}

/**
 * 生成済みコンテンツを複製する。新しいIDを発行し、テーマ末尾に「（コピー）」を付け、
 * 作成日時・更新日時を現在時刻に更新する。元のGeneratedContent・StrategyAnalysisは
 * 変更しない。戦略候補一覧(StrategyAnalysis)が存在すれば、新IDの下にも複製し、
 * 複製後の結果画面から「戦略を変更」を使えるようにする。
 */
export function duplicateGeneratedContent(id: string): GeneratedContent | undefined {
  const source = getContentById(id);
  if (!source) return undefined;

  const newId = generateContentId();
  const now = new Date().toISOString();
  const duplicated: GeneratedContent = {
    ...source,
    id: newId,
    input: { ...source.input, theme: `${source.input.theme}（コピー）` },
    createdAt: now,
    updatedAt: now,
    origin: "duplicate",
  };

  saveContent(duplicated);
  cloneStrategyAnalysisForNewId(id, newId);
  return duplicated;
}

/**
 * 履歴カードの削除。GeneratedContentがある場合は、分析結果(StrategyAnalysis)も
 * まとめて削除するかを呼び出し側で選べるようにする。
 */
export function deleteHistoryEntry(
  id: string,
  options: { deleteContent: boolean; deleteAnalysis: boolean },
): void {
  if (options.deleteContent) deleteContent(id);
  if (options.deleteAnalysis) deleteStrategyAnalysis(id);
}
