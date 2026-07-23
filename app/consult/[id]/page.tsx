"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getConsultSession, saveConsultSession } from "@/lib/consult-storage";
import { appendConsultRoundFromAi } from "@/lib/ai/build-consult";
import { buildConsultContextText } from "@/lib/consult-context";
import { getAllPerformanceRecords } from "@/lib/performance-storage";
import { findRelevantPerformanceRecords, buildPerformanceSummaryForPrompt } from "@/lib/performance-relevance";
import { buildStrategyAnalysisFromAi } from "@/lib/ai/build-strategy";
import { saveStrategyAnalysis } from "@/lib/strategy-storage";
import type { ConsultAiOutput } from "@/lib/ai/consult-schema";
import type { StrategyAnalysisAiOutput } from "@/lib/ai/strategy-schema";
import type { ConsultSession, GenerationUsage } from "@/lib/types";
import { GenerationProgress, STRATEGY_ANALYSIS_STAGES } from "@/components/input/GenerationProgress";
import { ConsultChatLog } from "@/components/consult/ConsultChatLog";
import { ConsultSummaryCard } from "@/components/consult/ConsultSummaryCard";
import { HistoryLink } from "@/components/history/HistoryLink";
import { PerformanceLink } from "@/components/performance/PerformanceLink";

const STAGE_INTERVAL_MS = 1500;
const LAST_AUTO_STAGE = STRATEGY_ANALYSIS_STAGES.length - 2;

export default function ConsultPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [session, setSession] = useState<ConsultSession | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [submittingRound, setSubmittingRound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const found = getConsultSession(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageはサーバーに存在せず、マウント後の同期読み込みが唯一の取得手段のため
    setSession(found ?? null);
    setStatus(found ? "ready" : "not-found");
  }, [id]);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  const startStageAnimation = () => {
    setStageIndex(0);
    stageTimer.current = setInterval(() => {
      setStageIndex((prev) => (prev < LAST_AUTO_STAGE ? prev + 1 : prev));
    }, STAGE_INTERVAL_MS);
  };

  const stopStageAnimation = () => {
    if (stageTimer.current) {
      clearInterval(stageTimer.current);
      stageTimer.current = null;
    }
  };

  const unansweredItems = (session?.qaItems ?? []).filter((item) => item.answer === undefined);
  const allDraftsFilled =
    unansweredItems.length > 0 && unansweredItems.every((item) => (draftAnswers[item.id] ?? "").trim().length > 0);

  const handleDraftChange = (itemId: string, value: string) => {
    setDraftAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmitRound = async () => {
    if (!session || !allDraftsFilled || submittingRound) return;
    setErrorMessage(null);
    setSubmittingRound(true);

    // 回答はAPI呼び出しの前に必ず保存する。通信に失敗しても、ユーザーが
    // 入力した回答自体は失われず、途中保存として復元できるようにするため。
    const updatedQaItems = session.qaItems.map((item) =>
      item.answer === undefined ? { ...item, answer: draftAnswers[item.id].trim() } : item,
    );
    const answeredSession: ConsultSession = {
      ...session,
      qaItems: updatedQaItems,
      updatedAt: new Date().toISOString(),
    };
    saveConsultSession(answeredSession);
    setSession(answeredSession);
    setDraftAnswers({});

    try {
      const qaHistory = updatedQaItems
        .filter((item): item is typeof item & { answer: string } => item.answer !== undefined)
        .map((item) => ({ question: item.question, reason: item.reason, answer: item.answer }));

      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: session.input, qaHistory }),
      });
      const json: { result?: ConsultAiOutput; usage?: GenerationUsage; message?: string } = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "分析に失敗しました。");
      }
      if (json.usage) {
        console.info("[madanai] consult usage", json.usage);
      }

      const { qaItems, status: nextStatus, summary } = appendConsultRoundFromAi(
        session.id,
        updatedQaItems,
        json.result,
      );
      const nextSession: ConsultSession = {
        ...answeredSession,
        qaItems,
        status: nextStatus,
        summary,
        updatedAt: new Date().toISOString(),
        lastUsage: json.usage,
      };
      saveConsultSession(nextSession);
      setSession(nextSession);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました。回答内容は保存されています。時間を置いてもう一度お試しください。",
      );
    } finally {
      setSubmittingRound(false);
    }
  };

  const handleConfirmSummary = async () => {
    if (!session || generatingStrategy) return;
    setErrorMessage(null);
    setGeneratingStrategy(true);
    startStageAnimation();

    // 過去の成果データはlocalStorageにのみ保存されており、サーバー(Route Handler)からは
    // アクセスできないため、ここで関連性の高い記録を選び出し要約してから送信する。
    const relevantPerformance = findRelevantPerformanceRecords(session.input, getAllPerformanceRecords());
    const pastPerformance = buildPerformanceSummaryForPrompt(relevantPerformance);
    const consultContext = buildConsultContextText(session.qaItems, session.summary);

    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: session.input, pastPerformance, consultContext }),
      });
      const json: { result?: unknown; usage?: GenerationUsage; message?: string } = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "戦略分析に失敗しました。");
      }
      if (json.usage) {
        console.info("[madanai] strategy analysis usage", json.usage);
      }

      setStageIndex(STRATEGY_ANALYSIS_STAGES.length - 1);
      const analysis = buildStrategyAnalysisFromAi(
        session.id,
        session.input,
        json.result as StrategyAnalysisAiOutput,
        json.usage,
      );

      try {
        saveStrategyAnalysis(analysis);
      } catch {
        throw new Error(
          "分析結果の保存に失敗しました。ブラウザのストレージ容量をご確認のうえ、もう一度お試しください。",
        );
      }

      router.push(`/strategy/${analysis.id}`);
    } catch (error) {
      stopStageAnimation();
      setGeneratingStrategy(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました。時間を置いてもう一度お試しください。",
      );
    }
  };

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-neutral-400">
        読み込み中...
      </main>
    );
  }

  if (status === "not-found" || !session) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-extrabold text-neutral-900">相談内容が見つかりません</h1>
        <p className="text-sm leading-7 text-neutral-500">
          このブラウザに保存された相談内容が見つかりませんでした。入力画面からやり直してください。
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
        >
          ← 入力画面へ戻る
        </Link>
      </main>
    );
  }

  if (generatingStrategy) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-6 py-24">
        <p className="text-sm font-semibold text-neutral-700">
          確認した内容をもとに戦略候補を検討しています。しばらくお待ちください…
        </p>
        <GenerationProgress currentStage={stageIndex} stages={STRATEGY_ANALYSIS_STAGES} />
      </main>
    );
  }

  return (
    <div className="pb-28">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-fit text-xs font-semibold text-neutral-500 transition hover:text-neutral-800"
            >
              ← 入力画面へ戻る
            </Link>
            <div className="flex items-center gap-3">
              <PerformanceLink />
              <HistoryLink />
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-fuchsia-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)]" />
            AIマーケティングコンサルモード
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            {session.status === "ready"
              ? "戦略提案に必要な情報が揃いました"
              : "AIマーケティングコンサルタントと壁打ち中です"}
          </h1>
          <p className="text-sm leading-6 text-neutral-500">
            {session.status === "ready"
              ? "AIが理解した内容を確認し、問題なければ戦略提案へ進んでください。"
              : "入力内容だけでは判断が難しい部分について、AIが必要な範囲で質問します。"}
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {session.qaItems.length > 0 ? (
          <ConsultChatLog
            qaItems={session.qaItems}
            draftAnswers={draftAnswers}
            onDraftChange={handleDraftChange}
            disabled={submittingRound}
          />
        ) : session.status === "in-progress" ? (
          <p className="text-sm text-neutral-400">AIが内容を確認しています…</p>
        ) : null}

        {submittingRound ? (
          <p className="text-xs font-semibold text-neutral-400">AIが回答を確認しています…</p>
        ) : null}

        {session.status === "ready" && session.summary ? (
          <div className="flex flex-col gap-4">
            <ConsultSummaryCard summary={session.summary} />
            <button
              type="button"
              onClick={handleConfirmSummary}
              className="w-fit rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)]"
            >
              この内容で戦略を提案する →
            </button>
          </div>
        ) : null}
      </main>

      {session.status === "in-progress" && unansweredItems.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3.5">
            <span className="text-xs font-semibold text-neutral-400">
              {unansweredItems.length}件の質問に回答してください
            </span>
            <button
              type="button"
              onClick={handleSubmitRound}
              disabled={!allDraftsFilled || submittingRound}
              className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingRound ? "送信中..." : "回答を送信する"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
