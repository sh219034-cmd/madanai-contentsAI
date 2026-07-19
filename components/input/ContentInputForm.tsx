"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentInputSchema, type ContentInputFormValues } from "@/lib/schema";
import { TONE_PRESETS } from "@/lib/madanai-brand";
import {
  createAndSaveMockContent,
  generateContentId,
  saveContent,
} from "@/lib/content-storage";
import { FIXED_DEMO_INPUT } from "@/lib/mock-generated-content";
import { buildGeneratedContentFromAi } from "@/lib/ai/build-content";
import type { GeneratedContentAiOutput } from "@/lib/ai/schema";
import type { GenerationUsage } from "@/lib/types";
import { GenerationProgress } from "./GenerationProgress";

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

const STAGE_INTERVAL_MS = 1500;
const LAST_AUTO_STAGE = 3; // 「最終調整しています」（index4）の手前まで自動で進める

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
  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContentInputFormValues>({
    resolver: zodResolver(contentInputSchema),
    defaultValues,
  });

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
    // 二重送信を防止する（生成中はフォーム自体が非表示になるが、念のため保持）
    if (generating) return;

    setErrorMessage(null);
    setGenerating(true);
    startStageAnimation();

    const input = {
      ...values,
      supplementary: values.supplementary || undefined,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json: {
        result?: unknown;
        usage?: GenerationUsage;
        message?: string;
      } = await res.json();

      if (!res.ok || !json.result) {
        throw new Error(json.message ?? "生成に失敗しました。");
      }

      if (json.usage) {
        // 開発者向け：トークン使用量・概算費用をコンソールに出力する
        console.info("[madanai] generation usage", json.usage);
      }

      setStageIndex(4);
      const id = generateContentId();
      const content = buildGeneratedContentFromAi(
        id,
        input,
        json.result as GeneratedContentAiOutput,
        json.usage,
      );

      try {
        saveContent(content);
      } catch {
        throw new Error(
          "生成結果の保存に失敗しました。ブラウザのストレージ容量をご確認のうえ、もう一度お試しください。",
        );
      }

      router.push(`/result/${content.id}`);
    } catch (error) {
      stopStageAnimation();
      setGenerating(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました。入力内容は保存されています。時間を置いてもう一度お試しください。",
      );
    }
  });

  const handleUseSample = () => {
    if (generating) return;
    const content = createAndSaveMockContent(FIXED_DEMO_INPUT);
    router.push(`/result/${content.id}`);
  };

  if (generating) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-neutral-700">
          AIが内容を作成しています。しばらくお待ちください…
        </p>
        <GenerationProgress currentStage={stageIndex} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
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
            {isSubmitting ? "作成中..." : "AIに相談する →"}
          </button>
          <button
            type="button"
            onClick={handleUseSample}
            disabled={isSubmitting}
            className="text-sm font-semibold text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            サンプルで確認する
          </button>
        </div>
      </form>
    </div>
  );
}
