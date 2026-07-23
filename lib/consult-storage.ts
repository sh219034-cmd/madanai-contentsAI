import type { ConsultSession } from "./types";

const STORAGE_KEY = "madanai:consult-sessions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): ConsultSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConsultSession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ConsultSession[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * AIマーケティングコンサルモード(チャット)の読み書き。
 * 途中で画面を閉じても、同じidの/consult/[id]へ戻れば質問履歴・回答・
 * 分析状況（進行中/十分）を復元できるよう、やり取りのたびに保存する。
 */
export function getConsultSession(id: string): ConsultSession | undefined {
  return readAll().find((session) => session.id === id);
}

export function saveConsultSession(session: ConsultSession): void {
  const all = readAll();
  const index = all.findIndex((s) => s.id === session.id);
  if (index === -1) {
    all.unshift(session);
  } else {
    all[index] = session;
  }
  writeAll(all);
}
