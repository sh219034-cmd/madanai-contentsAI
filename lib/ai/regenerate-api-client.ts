"use client";

import type { ContentInput, GenerationUsage } from "@/lib/types";
import type { RegenerateKind } from "./regenerate-types";

type RegenerateApiPayload = {
  input: ContentInput;
  kind: RegenerateKind;
  label: string;
  current: string | string[] | { type?: string; title: string; body: string; items: string[] };
  instruction?: string;
};

/**
 * /api/regenerate を呼び出す。失敗時はユーザー向けメッセージ付きのErrorを投げる。
 */
export async function callRegenerateApi(
  payload: RegenerateApiPayload,
): Promise<unknown> {
  const res = await fetch("/api/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json: { result?: unknown; usage?: GenerationUsage; message?: string } =
    await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? "再生成に失敗しました。");
  }

  if (json.usage) {
    // 開発者向け：トークン使用量・概算費用をコンソールに出力する
    console.info("[madanai] regeneration usage", json.usage);
  }

  return json.result;
}
