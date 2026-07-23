"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentInputSchema, type ContentInputFormValues } from "@/lib/schema";
import { TONE_PRESETS } from "@/lib/madanai-brand";
import { generateContentId, getContentById } from "@/lib/content-storage";
import { getStrategyAnalysis, saveStrategyAnalysis } from "@/lib/strategy-storage";
import { saveConsultSession } from "@/lib/consult-storage";
import { FIXED_DEMO_INPUT } from "@/lib/mock-generated-content";
import { buildMockStrategyAnalysis } from "@/lib/mock-strategy-analysis";
import { appendConsultRoundFromAi } from "@/lib/ai/build-consult";
import type { ConsultAiOutput } from "@/lib/ai/consult-schema";
import type { ConsultSession, ContentInput, GenerationUsage } from "@/lib/types";
import { GenerationProgress, CONSULT_STAGES } from "./GenerationProgress";

const defaultValues: ContentInputFormValues = {
  theme: "",
  target: "",
  targetPain: "",
  offerGoal: "",
  pageCount: 6,
  tone: TONE_PRESETS[0],
  desiredAction: "",
  supplementary: "",
};

const STAGE_INTERVAL_MS = 1200;
const LAST_AUTO_STAGE = CONSULT_STAGES.length - 2;

type ReanalysisSource = { sourceId: string; sourceType: "strategy" | "result" } | null;

function toContentInput(values: ContentInputFormValues): ContentInput {
  return { ...values, supplementary: values.supplementary || undefined };
}

/**
 * ?editAnalysisId=xxx（戦略画面から）または ?sourceContentId=xxx（結果画面から）の
 * クエリパラメータから、元のContentInputを復元する。見つからない場合はundefinedを返し、
 * 呼び出し側は通常の空フォームとして表示する（エラーで画面を止めない）。
 */
function resolveReanalysisSource(
  searchParams: URLSearchParams,
): { input: ContentInput; source: ReanalysisSource } | undefined {
  const editAnalysisId = searchParams.get("editAnalysisId");
  if (editAnalysisId) {
    const analysis = getStrategyAnalysis(editAnalysisId);
    if (analysis) {
      return { input: analysis.input, source: { sourceId: editAnalysisId, sourceType: "strategy" } };
    }
    return undefined;
  }

  const sourceContentId = searchParams.get("sourceContentId");
  if (sourceContentId) {
    const content = getContentById(sourceContentId);
    if (content) {
      return { input: content.input, source: { sourceId: sourceContentId, sourceType: "result" } };
    }
    // GeneratedContentが見つからない場合は、同じidのStrategyAnalysisにフォールバックする
    const analysis = getStrategyAnalysis(sourceContentId);
    if (analysis) {
      return { input: analysis.input, source: { sourceId: sourceContentId, sourceType: "result" } };
    }
    return undefined;
  }

  return undefined;
}

function FieldShell({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: FieldError;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-neutral-800">{label}</span>
      {hint ? <span className="text-xs text-neutral-500">{hint}</span> : null}
      {children}
      {error ? (
        <span className="text-xs font-medium text-rose-600">
          {error.message}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-400/60";

export function ContentInputForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reanalysis, setReanalysis] = useState<ReanalysisSource>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ContentInputFormValues>({
    resolver: zodResolver(contentInputSchema),
    defaultValues,
  });

  useEffect(() => {
    const resolved = resolveReanalysisSource(searchParams);
    if (!resolved) return;
    // localStorageの読み込みはマウント後にのみ可能なため、ここで復元する。
    reset({ ...resolved.input, supplementary: resolved.input.supplementary ?? "" });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 上記の理由により、マウント後の同期読み込みが唯一の取得手段のため
    setReanalysis(resolved.source);
  }, [searchParams, reset]);

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

  // stageTimerはこのイベントハンドラ内からのみ操作し、レンダー中には
  // 読み書きしないため react-hooks/refs を無効化する。
  // eslint-disable-next-line react-hooks/refs
  const onSubmit = handleSubmit(async (values) => {
    // 二重送信を防止する（分析中はフォーム自体が非表示になるが、念のため保持）
    if (analyzing) return;

    setErrorMessage(null);
    setAnalyzing(true);
    startStageAnimation();

    const input = toContentInput(values);

    try {
      // 戦略提案の前に、AIマーケティングコンサルモード(/consult)で追加情報が
      // 必要か確認する。ここでは最初のラウンドのみ呼び出し、以降のやり取りは
      // /consult/[id]画面で行う（質問が0件ならそのまま「十分」として画面へ渡る）。
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, qaHistory: [] }),
      });
      const json: {
        result?: ConsultAiOutput;
        usage?: GenerationUsage;
        message?: string;
      } = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "分析に失敗しました。");
      }

      if (json.usage) {
        // 開発者向け：トークン使用量・概算費用をコンソールに出力する
        console.info("[madanai] consult usage", json.usage);
      }

      setStageIndex(CONSULT_STAGES.length - 1);
      const id = generateContentId();
      const now = new Date().toISOString();
      const { qaItems, status, summary } = appendConsultRoundFromAi(id, [], json.result);
      const session: ConsultSession = {
        id,
        createdAt: now,
        updatedAt: now,
        input,
        qaItems,
        status,
        summary,
        lastUsage: json.usage,
      };

      try {
        saveConsultSession(session);
      } catch {
        throw new Error(
          "分析結果の保存に失敗しました。ブラウザのストレージ容量をご確認のうえ、もう一度お試しください。",
        );
      }

      router.push(`/consult/${session.id}`);
    } catch (error) {
      stopStageAnimation();
      setAnalyzing(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました。入力内容は保存されています。時間を置いてもう一度お試しください。",
      );
    }
  });

  const handleUseSample = () => {
    if (analyzing) return;
    // 再分析モードでは、フォームに復元・編集済みの内容をサンプル分析にも使う
    // （通常モードでは空フォームのままでも試せるよう、固定デモ入力を使う）
    const input = reanalysis ? toContentInput(getValues()) : FIXED_DEMO_INPUT;
    const id = generateContentId();
    const analysis = buildMockStrategyAnalysis(id, input);
    saveStrategyAnalysis(analysis);
    router.push(`/strategy/${analysis.id}`);
  };

  if (analyzing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-neutral-700">
          AIマーケティング担当者が内容を分析しています。しばらくお待ちください…
        </p>
        <GenerationProgress currentStage={stageIndex} stages={CONSULT_STAGES} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {reanalysis ? (
        <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/60 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-700">
            過去の入力内容を引き継いでいます。内容を修正して、もう一度分析できます。
          </p>
          <Link
            href={
              reanalysis.sourceType === "strategy"
                ? `/strategy/${reanalysis.sourceId}`
                : `/result/${reanalysis.sourceId}`
            }
            className="mt-1 inline-block text-xs font-bold text-fuchsia-600 underline underline-offset-4"
          >
            {reanalysis.sourceType === "strategy" ? "← 元の戦略画面へ戻る" : "← 元の結果画面へ戻る"}
          </Link>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <FieldShell
          label="コンテンツのテーマ"
          hint="例）梅雨時期の外壁塗装キャンペーン"
          error={errors.theme}
        >
          <input
            className={inputClass}
            placeholder="例）梅雨時期の外壁塗装キャンペーン"
            {...register("theme")}
          />
        </FieldShell>

        <FieldShell
          label="ターゲット"
          hint="例）築15年以上の持ち家にお住まいの40〜60代"
          error={errors.target}
        >
          <input
            className={inputClass}
            placeholder="例）築15年以上の持ち家にお住まいの40〜60代"
            {...register("target")}
          />
        </FieldShell>

        <FieldShell
          label="ターゲットの悩み"
          hint="具体的であるほど、共感から始まる文章になります"
          error={errors.targetPain}
        >
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            placeholder="例）外壁の劣化が気になるが、どこに相談していいか分からず放置している"
            {...register("targetPain")}
          />
        </FieldShell>

        <FieldShell
          label="特典の目的"
          hint="例）LINE登録を増やし、個別相談につなげたい"
          error={errors.offerGoal}
        >
          <input
            className={inputClass}
            placeholder="例）LINE登録を増やし、個別相談につなげたい"
            {...register("offerGoal")}
          />
        </FieldShell>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FieldShell label="ページ数" error={errors.pageCount}>
            <input
              type="number"
              min={3}
              max={20}
              className={inputClass}
              {...register("pageCount", { valueAsNumber: true })}
            />
          </FieldShell>

          <FieldShell label="文章の雰囲気" error={errors.tone}>
            <select className={inputClass} {...register("tone")}>
              {TONE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </FieldShell>
        </div>

        <FieldShell
          label="最終的に誘導したい行動"
          hint="例）LINE友だち追加後、無料相談への申込"
          error={errors.desiredAction}
        >
          <input
            className={inputClass}
            placeholder="例）LINE友だち追加後、無料相談への申込"
            {...register("desiredAction")}
          />
        </FieldShell>

        <FieldShell
          label="補足情報（任意）"
          hint="サービスの特徴、避けたい表現、参考事例など"
          error={errors.supplementary}
        >
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            placeholder="例）過去の相談事例、他社との違い、伝えたいトーンなど"
            {...register("supplementary")}
          />
        </FieldShell>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "分析中..."
              : `${reanalysis ? "修正した内容で再分析する" : "AIマーケティング担当者に相談する"} →`}
          </button>
          <button
            type="button"
            onClick={handleUseSample}
            disabled={isSubmitting}
            className="text-sm font-semibold text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reanalysis ? "修正した内容でサンプル分析する" : "サンプルで確認する"}
          </button>
        </div>
      </form>
    </div>
  );
}
