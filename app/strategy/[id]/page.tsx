"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { GeneratedContent, GenerationUsage, StrategyAnalysis, StrategyCandidate } from "@/lib/types";
import { getStrategyAnalysis, cloneStrategyAnalysisForNewId } from "@/lib/strategy-storage";
import { getContentById, saveContent, generateContentId, createAndSaveMockGeneratedContent } from "@/lib/content-storage";
import { buildGeneratedContentFromAi } from "@/lib/ai/build-content";
import type { GeneratedContentAiOutput } from "@/lib/ai/schema";
import { GenerationProgress, CONTENT_GENERATION_STAGES } from "@/components/input/GenerationProgress";
import { RecommendedStrategyCard } from "@/components/strategy/RecommendedStrategyCard";
import { StrategyCandidateCard } from "@/components/strategy/StrategyCandidateCard";
import { StrategyChangeConfirmModal } from "@/components/strategy/StrategyChangeConfirmModal";

const STAGE_INTERVAL_MS = 1500;
const LAST_AUTO_STAGE = CONTENT_GENERATION_STAGES.length - 2;

export default function StrategyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [existingContent, setExistingContent] = useState<GeneratedContent | null>(null);

  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingCandidate, setPendingCandidate] = useState<StrategyCandidate | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const found = getStrategyAnalysis(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorageはサーバーに存在せず、マウント後の同期読み込みが唯一の取得手段のため
    setAnalysis(found ?? null);
    setExistingContent(getContentById(id) ?? null);
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

  const runGeneration = async (candidate: StrategyCandidate, targetId: string) => {
    if (!analysis) return;
    setErrorMessage(null);
    setGenerating(true);
    startStageAnimation();

    if (analysis.isMock) {
      setStageIndex(CONTENT_GENERATION_STAGES.length - 1);
      try {
        createAndSaveMockGeneratedContent(targetId, analysis.input, candidate);
      } catch {
        stopStageAnimation();
        setGenerating(false);
        setErrorMessage(
          "生成結果の保存に失敗しました。ブラウザのストレージ容量をご確認のうえ、もう一度お試しください。",
        );
        return;
      }
      router.push(`/result/${targetId}`);
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: analysis.input, strategy: candidate }),
      });
      const json: { result?: unknown; usage?: GenerationUsage; message?: string } = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "生成に失敗しました。");
      }
      if (json.usage) {
        // 開発者向け：トークン使用量・概算費用をコンソールに出力する
        console.info("[madanai] generation usage", json.usage);
      }

      setStageIndex(CONTENT_GENERATION_STAGES.length - 1);
      const content = buildGeneratedContentFromAi(
        targetId,
        analysis.input,
        json.result as GeneratedContentAiOutput,
        candidate,
        json.usage,
      );

      try {
        saveContent(content);
      } catch {
        throw new Error(
          "生成結果の保存に失敗しました。ブラウザのストレージ容量をご確認のうえ、もう一度お試しください。",
        );
      }

      router.push(`/result/${targetId}`);
    } catch (error) {
      stopStageAnimation();
      setGenerating(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました。時間を置いてもう一度お試しください。",
      );
    }
  };

  const handleSelect = (candidate: StrategyCandidate) => {
    if (generating) return;
    if (existingContent) {
      setPendingCandidate(candidate);
      return;
    }
    void runGeneration(candidate, id);
  };

  const handleConfirmDuplicate = () => {
    if (!pendingCandidate) return;
    const candidate = pendingCandidate;
    const newId = generateContentId();
    cloneStrategyAnalysisForNewId(id, newId);
    setPendingCandidate(null);
    void runGeneration(candidate, newId);
  };

  const handleConfirmOverwrite = () => {
    if (!pendingCandidate) return;
    const candidate = pendingCandidate;
    setPendingCandidate(null);
    void runGeneration(candidate, id);
  };

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-neutral-400">
        読み込み中...
      </main>
    );
  }

  if (status === "not-found" || !analysis) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-extrabold text-neutral-900">戦略の分析結果が見つかりません</h1>
        <p className="text-sm leading-7 text-neutral-500">
          このブラウザに保存された分析結果が見つかりませんでした。入力画面からやり直してください。
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

  if (generating) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-6 py-24">
        <p className="text-sm font-semibold text-neutral-700">
          選択した戦略でコンテンツを作成しています。しばらくお待ちください…
        </p>
        <GenerationProgress currentStage={stageIndex} stages={CONTENT_GENERATION_STAGES} />
      </main>
    );
  }

  const recommended =
    analysis.candidates.find((c) => c.isRecommended) ?? analysis.candidates[0];
  const others = analysis.candidates.filter((c) => c.id !== recommended.id);
  const isChangeMode = Boolean(existingContent);
  const selectedId = existingContent?.selectedStrategy.id;
  const selectLabel = isChangeMode ? "この戦略に切り替える" : "この戦略で作る";

  return (
    <div className="pb-20">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-6">
          <Link
            href="/"
            className="w-fit text-xs font-semibold text-neutral-500 transition hover:text-neutral-800"
          >
            ← 入力画面へ戻る
          </Link>
          <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-fuchsia-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)]" />
            AIマーケティング分析 完了
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            {isChangeMode
              ? "戦略を変更します。どの戦略にしますか？"
              : "あなたの入力内容を分析しました。"}
          </h1>
          <p className="text-sm leading-6 text-neutral-500">
            {isChangeMode
              ? "選び直すと、PDF・LINE・SNS文章が新しい戦略に合わせて再生成されます。"
              : "狙いどころが異なる戦略案を作成しました。まずはおすすめの1案からご覧ください。"}
          </p>
          {analysis.isMock ? (
            <p className="w-fit rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-neutral-500">
              この戦略候補はサンプルデータです（Claude APIは呼び出していません）
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <RecommendedStrategyCard
          candidate={recommended}
          isSelected={selectedId === recommended.id}
          selectLabel={selectLabel}
          onSelect={() => handleSelect(recommended)}
        />

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-extrabold text-neutral-700">
              他の戦略候補（{others.length}件）
            </h2>
            <span className="text-[11px] text-neutral-400">タップして「{selectLabel}」</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((candidate) => (
              <StrategyCandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedId === candidate.id}
                selectLabel={selectLabel}
                onSelect={() => handleSelect(candidate)}
              />
            ))}
          </div>
        </section>

        {isChangeMode ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-fit text-xs font-semibold text-neutral-400 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-700"
          >
            再分析する（入力内容を変更する場合）
          </button>
        ) : null}
      </main>

      {pendingCandidate ? (
        <StrategyChangeConfirmModal
          candidate={pendingCandidate}
          onCancel={() => setPendingCandidate(null)}
          onDuplicate={handleConfirmDuplicate}
          onOverwrite={handleConfirmOverwrite}
        />
      ) : null}
    </div>
  );
}
