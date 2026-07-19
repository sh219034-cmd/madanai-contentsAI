"use client";

import { useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentInputSchema, type ContentInputFormValues } from "@/lib/schema";
import { TONE_PRESETS } from "@/lib/madanai-brand";

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
  const [submitted, setSubmitted] = useState<ContentInputFormValues | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContentInputFormValues>({
    resolver: zodResolver(contentInputSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    // STEP1時点ではClaude APIに未接続のため、入力内容の確認表示のみ行う。
    // STEP2以降で /result/[id] への生成・遷移に置き換える。
    await new Promise((resolve) => setTimeout(resolve, 300));
    setSubmitted(values);
  });

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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(168,85,247,0.28)] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "確認中..." : "AIに相談する →"}
        </button>
      </form>

      {submitted ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="mb-3 text-sm font-bold text-neutral-800">
            入力内容を受け付けました（STEP2以降で生成結果画面に接続予定）
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-neutral-600">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
