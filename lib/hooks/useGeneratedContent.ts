"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeneratedContent } from "@/lib/types";
import { getContentById, saveContent } from "@/lib/content-storage";

export type SaveStatus = "loading" | "saving" | "saved" | "not-found";

const AUTOSAVE_DELAY_MS = 400;

/**
 * IDに対応するGeneratedContentをlocalStorageから読み込み、
 * 編集のたびにデバウンス付きで自動保存する。
 *
 * localStorageはサーバーに存在しないため、初期読み込みは
 * マウント後のuseEffectで行う（サーバーとクライアントの初回レンダーを
 * 「loading」で揃え、ハイドレーション不一致を避けるため）。
 */
export function useGeneratedContent(id: string) {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const found = getContentById(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageはサーバーに存在せず、マウント後の同期読み込みが唯一の取得手段のため
    setContent(found ?? null);
    setStatus(found ? "saved" : "not-found");
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const mutate = useCallback(
    (updater: (prev: GeneratedContent) => GeneratedContent) => {
      setContent((prev) => {
        if (!prev) return prev;
        const next = { ...updater(prev), updatedAt: new Date().toISOString() };

        setStatus("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveContent(next);
          setStatus("saved");
        }, AUTOSAVE_DELAY_MS);

        return next;
      });
    },
    [],
  );

  return { content, status, mutate };
}
