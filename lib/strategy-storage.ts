import type { StrategyAnalysis } from "./types";

const STORAGE_KEY = "madanai:strategy-analyses";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): StrategyAnalysis[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StrategyAnalysis[]) : [];
  } catch {
    return [];
  }
}

function writeAll(analyses: StrategyAnalysis[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
}

/**
 * AIマーケティング分析結果(戦略候補一覧)の読み書き。
 * GeneratedContentとは別のlocalStorageキーに保存し、
 * 「戦略を変更」時に再分析せず同じ候補一覧を再利用できるようにする。
 */
export function getStrategyAnalysis(id: string): StrategyAnalysis | undefined {
  return readAll().find((analysis) => analysis.id === id);
}

export function getAllStrategyAnalyses(): StrategyAnalysis[] {
  return readAll();
}

export function deleteStrategyAnalysis(id: string): void {
  writeAll(readAll().filter((analysis) => analysis.id !== id));
}

export function saveStrategyAnalysis(analysis: StrategyAnalysis): void {
  const all = readAll();
  const index = all.findIndex((a) => a.id === analysis.id);
  if (index === -1) {
    all.unshift(analysis);
  } else {
    all[index] = analysis;
  }
  writeAll(all);
}

/** 複製して別案を作る際、同じ候補一覧を新しいidの下にもコピーする。 */
export function cloneStrategyAnalysisForNewId(
  sourceId: string,
  newId: string,
): StrategyAnalysis | undefined {
  const source = getStrategyAnalysis(sourceId);
  if (!source) return undefined;
  const cloned: StrategyAnalysis = { ...source, id: newId };
  saveStrategyAnalysis(cloned);
  return cloned;
}
