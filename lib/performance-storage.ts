import type { PerformanceRecord } from "./types";

const STORAGE_KEY = "madanai:performance-records";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): PerformanceRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PerformanceRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: PerformanceRecord[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * 成果記録(PerformanceRecord)の読み書きをここに集約する。
 * 成果が悪い記録も削除せず、比較・振り返りに使えるよう残す（呼び出し側の
 * 判断で明示的にdeletePerformanceRecordを呼んだ場合のみ削除する）。
 */
export function getAllPerformanceRecords(): PerformanceRecord[] {
  return readAll();
}

export function getPerformanceRecordById(id: string): PerformanceRecord | undefined {
  return readAll().find((record) => record.id === id);
}

export function getPerformanceRecordsByContentId(contentId: string): PerformanceRecord[] {
  return readAll().filter((record) => record.contentId === contentId);
}

export function savePerformanceRecord(record: PerformanceRecord): void {
  const all = readAll();
  const index = all.findIndex((r) => r.id === record.id);
  if (index === -1) {
    all.unshift(record);
  } else {
    all[index] = record;
  }
  writeAll(all);
}

export function deletePerformanceRecord(id: string): void {
  writeAll(readAll().filter((record) => record.id !== id));
}

export function generatePerformanceRecordId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `performance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
