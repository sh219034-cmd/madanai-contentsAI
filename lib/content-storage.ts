import type { ContentInput, GeneratedContent } from "./types";
import { buildMockGeneratedContent } from "./mock-generated-content";

const STORAGE_KEY = "madanai:contents";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): GeneratedContent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeneratedContent[]) : [];
  } catch {
    return [];
  }
}

function writeAll(contents: GeneratedContent[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
}

/**
 * localStorageの読み書きをここに集約する。
 * 将来Supabase等のDBへ差し替える際は、この関数群のシグネチャを保ったまま
 * 実装だけを置き換えられるようにしている。
 */
export function getAllContents(): GeneratedContent[] {
  return readAll();
}

export function getContentById(id: string): GeneratedContent | undefined {
  return readAll().find((content) => content.id === id);
}

export function saveContent(content: GeneratedContent): void {
  const all = readAll();
  const index = all.findIndex((c) => c.id === content.id);
  if (index === -1) {
    all.unshift(content);
  } else {
    all[index] = content;
  }
  writeAll(all);
}

export function deleteContent(id: string): void {
  writeAll(readAll().filter((c) => c.id !== id));
}

/**
 * 入力内容からモックの生成結果を作成し、localStorageへ保存する。
 * STEP3ではこの関数の中身をClaude API呼び出しに差し替える
 * （呼び出し側のインターフェースは変えない想定）。
 */
export function createAndSaveMockContent(input: ContentInput): GeneratedContent {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const content = buildMockGeneratedContent(id, input);
  saveContent(content);
  return content;
}
