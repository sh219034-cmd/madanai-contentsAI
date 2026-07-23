"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HistoryItem, HistoryStatus } from "@/lib/types";
import { getHistoryItems, duplicateGeneratedContent, deleteHistoryEntry } from "@/lib/history-storage";
import { HistoryCard } from "@/components/history/HistoryCard";
import { HistoryDeleteConfirmModal } from "@/components/history/HistoryDeleteConfirmModal";
import { PerformanceLink } from "@/components/performance/PerformanceLink";
import { PerformanceRecordFormModal } from "@/components/performance/PerformanceRecordFormModal";

type SortOption = "createdDesc" | "createdAsc" | "updatedDesc";

const STATUS_OPTIONS: { value: HistoryStatus | "all"; label: string }[] = [
  { value: "all", label: "すべての状態" },
  { value: "strategy-only", label: "戦略分析のみ" },
  { value: "generated", label: "コンテンツ生成済み" },
  { value: "duplicate", label: "別案" },
  { value: "sample", label: "サンプル" },
];

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-400/60";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [themeQuery, setThemeQuery] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("createdDesc");
  const [pendingDelete, setPendingDelete] = useState<HistoryItem | null>(null);
  const [performanceTarget, setPerformanceTarget] = useState<HistoryItem | null>(null);

  useEffect(() => {
    // localStorageはサーバーに存在せず、マウント後の同期読み込みが唯一の取得手段のため
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getHistoryItems());
  }, []);

  const handleDuplicate = (id: string) => {
    const duplicated = duplicateGeneratedContent(id);
    if (duplicated) router.push(`/result/${duplicated.id}`);
  };

  const handleDeleteConfirm = (options: { deleteContent: boolean; deleteAnalysis: boolean }) => {
    if (!pendingDelete) return;
    deleteHistoryEntry(pendingDelete.id, options);
    setItems(getHistoryItems());
    setPendingDelete(null);
  };

  if (items === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-neutral-400">
        読み込み中...
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pb-20">
        <header className="border-b border-neutral-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
            <Link href="/" className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800">
              ← 入力画面へ戻る
            </Link>
            <h1 className="text-sm font-extrabold text-neutral-900">作成履歴</h1>
            <PerformanceLink />
          </div>
        </header>
        <main className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-24 text-center">
          <p className="text-sm leading-7 text-neutral-500">まだ作成履歴がありません</p>
          <Link
            href="/"
            className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-6 py-3 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)]"
          >
            最初のコンテンツを作成する
          </Link>
        </main>
      </div>
    );
  }

  const filtered = items
    .filter((item) => !themeQuery || item.theme.toLowerCase().includes(themeQuery.toLowerCase()))
    .filter((item) => !targetQuery || item.target.toLowerCase().includes(targetQuery.toLowerCase()))
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "createdDesc") return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === "createdAsc") return a.createdAt.localeCompare(b.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return (
    <div className="pb-20">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800">
              ← 入力画面へ戻る
            </Link>
            <div className="flex items-center gap-3">
              <PerformanceLink />
              <span className="text-[11px] font-semibold text-neutral-400">{items.length}件</span>
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">作成履歴</h1>
          <p className="text-sm leading-6 text-neutral-500">
            保存済みの戦略分析・生成コンテンツを一覧から探して再度開けます。
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="テーマで検索"
              value={themeQuery}
              onChange={(e) => setThemeQuery(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="ターゲットで検索"
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className={inputClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as HistoryStatus | "all")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="createdDesc">作成日の新しい順</option>
              <option value="createdAsc">作成日の古い順</option>
              <option value="updatedDesc">更新日の新しい順</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-400">条件に一致する履歴が見つかりません</p>
        ) : (
          filtered.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onDuplicate={handleDuplicate}
              onDelete={setPendingDelete}
              onRecordPerformance={setPerformanceTarget}
            />
          ))
        )}
      </main>

      {pendingDelete ? (
        <HistoryDeleteConfirmModal
          item={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}

      {performanceTarget ? (
        <PerformanceRecordFormModal
          prefill={{
            contentId: performanceTarget.id,
            title: performanceTarget.theme,
            target: performanceTarget.target,
            strategyName: performanceTarget.selectedStrategyName ?? "",
          }}
          onClose={() => setPerformanceTarget(null)}
          onSaved={() => setPerformanceTarget(null)}
        />
      ) : null}
    </div>
  );
}
