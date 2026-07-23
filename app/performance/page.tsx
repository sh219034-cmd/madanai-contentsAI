"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PerformanceRecord } from "@/lib/types";
import {
  getAllPerformanceRecords,
  deletePerformanceRecord,
} from "@/lib/performance-storage";
import { PERFORMANCE_CHANNEL_OPTIONS, PERFORMANCE_CHANNEL_LABEL } from "@/lib/performance-labels";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { PerformanceCompareTable } from "@/components/performance/PerformanceCompareTable";
import { PerformanceRecordFormModal } from "@/components/performance/PerformanceRecordFormModal";
import { PerformanceReviewModal } from "@/components/performance/PerformanceReviewModal";

type SortOption = "createdDesc" | "inquiriesDesc" | "contractsDesc" | "revenueDesc";

const SORT_LABEL: Record<SortOption, string> = {
  createdDesc: "新しい順",
  inquiriesDesc: "問い合わせ数順",
  contractsDesc: "契約数順",
  revenueDesc: "売上順",
};

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-400/60";

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[] | null>(null);
  const [themeQuery, setThemeQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("createdDesc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PerformanceRecord | null>(null);
  const [reviewingRecord, setReviewingRecord] = useState<PerformanceRecord | null>(null);

  useEffect(() => {
    // localStorageはサーバーに存在せず、マウント後の同期読み込みが唯一の取得手段のため
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(getAllPerformanceRecords());
  }, []);

  const strategyOptions = useMemo(() => {
    if (!records) return [];
    const names = new Set(records.map((r) => r.strategyName).filter((name) => name.trim().length > 0));
    return Array.from(names);
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => !themeQuery || r.title.toLowerCase().includes(themeQuery.toLowerCase()))
      .filter((r) => channelFilter === "all" || r.channel === channelFilter)
      .filter((r) => strategyFilter === "all" || r.strategyName === strategyFilter)
      .filter((r) => !dateFrom || r.publishedAt >= dateFrom)
      .filter((r) => !dateTo || r.publishedAt <= dateTo)
      .sort((a, b) => {
        if (sortBy === "inquiriesDesc") return (b.metrics.inquiries ?? -1) - (a.metrics.inquiries ?? -1);
        if (sortBy === "contractsDesc") return (b.metrics.contracts ?? -1) - (a.metrics.contracts ?? -1);
        if (sortBy === "revenueDesc") return (b.metrics.revenue ?? -1) - (a.metrics.revenue ?? -1);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [records, themeQuery, channelFilter, strategyFilter, dateFrom, dateTo, sortBy]);

  const selectedRecords = useMemo(
    () => (records ?? []).filter((r) => selectedIds.includes(r.id)),
    [records, selectedIds],
  );

  const refresh = () => setRecords(getAllPerformanceRecords());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    deletePerformanceRecord(pendingDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== pendingDelete.id));
    setPendingDelete(null);
    refresh();
  };

  if (records === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-neutral-400">
        読み込み中...
      </main>
    );
  }

  return (
    <div className="pb-20">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-800">
              ← 入力画面へ戻る
            </Link>
            <span className="text-[11px] font-semibold text-neutral-400">{records.length}件</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">成果管理</h1>
          <p className="text-sm leading-6 text-neutral-500">
            公開したコンテンツの成果を記録し、次回の戦略分析の参考情報として活用します。
            記録された成果は再現性や結果を保証するものではありません。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-2.5 text-[13px] font-bold text-white"
            >
              成果を記録する
            </button>
            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-semibold text-neutral-400 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-700"
              >
                比較選択を解除（{selectedIds.length}/2）
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="テーマ（コンテンツ名）で検索"
              value={themeQuery}
              onChange={(e) => setThemeQuery(e.target.value)}
            />
            <select className={inputClass} value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)}>
              <option value="all">すべての戦略</option>
              {strategyOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select className={inputClass} value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
              <option value="all">すべての媒体</option>
              {PERFORMANCE_CHANNEL_OPTIONS.map((opt) => (
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
              {(Object.keys(SORT_LABEL) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABEL[option]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-neutral-500">公開日（開始）</span>
              <input type="date" className={inputClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-neutral-500">公開日（終了）</span>
              <input type="date" className={inputClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
        {selectedRecords.length === 2 ? <PerformanceCompareTable records={selectedRecords} /> : null}

        {records.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-400">まだ成果記録がありません</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-400">条件に一致する記録が見つかりません</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((record) => (
              <PerformanceCard
                key={record.id}
                record={record}
                selectable
                selected={selectedIds.includes(record.id)}
                onToggleSelect={() => toggleSelect(record.id)}
                onEdit={() => setEditingRecord(record)}
                onDelete={() => setPendingDelete(record)}
                onReview={() => setReviewingRecord(record)}
              />
            ))}
          </div>
        )}
      </main>

      {(creatingNew || editingRecord) ? (
        <PerformanceRecordFormModal
          initial={editingRecord ?? undefined}
          onClose={() => {
            setCreatingNew(false);
            setEditingRecord(null);
          }}
          onSaved={() => {
            setCreatingNew(false);
            setEditingRecord(null);
            refresh();
          }}
        />
      ) : null}

      {reviewingRecord ? (
        <PerformanceReviewModal record={reviewingRecord} onClose={() => setReviewingRecord(null)} />
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6">
            <h2 className="text-[15px] font-extrabold text-neutral-900">この成果記録を削除しますか？</h2>
            <p className="text-[13px] leading-relaxed text-neutral-500">
              「{pendingDelete.title}」（{PERFORMANCE_CHANNEL_LABEL[pendingDelete.channel]}）の記録を削除します。
              この操作は元に戻せません。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition hover:border-neutral-300"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-rose-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
