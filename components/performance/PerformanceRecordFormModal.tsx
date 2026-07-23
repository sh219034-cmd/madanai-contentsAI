"use client";

import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  performanceRecordFormSchema,
  type PerformanceRecordFormValues,
} from "@/lib/performance-schema";
import { PERFORMANCE_CHANNEL_OPTIONS, CHANNEL_TO_CONTENT_TYPE } from "@/lib/performance-labels";
import {
  savePerformanceRecord,
  generatePerformanceRecordId,
} from "@/lib/performance-storage";
import type { PerformanceMetrics, PerformanceRecord } from "@/lib/types";

type Prefill = {
  contentId: string;
  title: string;
  target: string;
  strategyName: string;
};

const METRIC_KEYS = [
  "impressions",
  "reach",
  "views",
  "likes",
  "comments",
  "saves",
  "shares",
  "profileVisits",
  "linkClicks",
  "lineAdds",
  "formSubmissions",
  "inquiries",
  "contracts",
  "revenue",
] as const satisfies readonly (keyof PerformanceMetrics)[];

/** 編集時、保存済みの数値をフォーム表示用の文字列へ変換する（未入力はundefinedのまま）。 */
function metricsToFormStrings(metrics: PerformanceMetrics): PerformanceRecordFormValues["metrics"] {
  const result: PerformanceRecordFormValues["metrics"] = {};
  for (const key of METRIC_KEYS) {
    const value = metrics[key];
    if (value !== undefined) result[key] = String(value);
  }
  return result;
}

/** 送信時、フォームの文字列をPerformanceMetrics(数値)へ変換する。空欄はundefinedのまま残す。 */
function formStringsToMetrics(form: PerformanceRecordFormValues["metrics"]): PerformanceMetrics {
  const result: PerformanceMetrics = {};
  for (const key of METRIC_KEYS) {
    const value = form[key];
    if (value !== undefined && value.trim() !== "") result[key] = Number(value.trim());
  }
  return result;
}

function buildDefaultValues(
  initial?: PerformanceRecord,
  prefill?: Prefill,
): PerformanceRecordFormValues {
  if (initial) {
    return {
      channel: initial.channel,
      publishedAt: initial.publishedAt,
      measurementPeriod: initial.measurementPeriod,
      title: initial.title,
      target: initial.target,
      strategyName: initial.strategyName,
      notes: initial.notes,
      metrics: metricsToFormStrings(initial.metrics),
    };
  }
  return {
    channel: "instagram-post",
    publishedAt: new Date().toISOString().slice(0, 10),
    measurementPeriod: "",
    title: prefill?.title ?? "",
    target: prefill?.target ?? "",
    strategyName: prefill?.strategyName ?? "",
    notes: "",
    metrics: {},
  };
}

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13.5px] text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-400/60";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-neutral-700">{label}</span>
      {children}
      {error ? <span className="text-[11px] font-medium text-rose-600">{error.message}</span> : null}
    </label>
  );
}

const METRIC_FIELDS: { key: keyof PerformanceRecordFormValues["metrics"]; label: string }[] = [
  { key: "impressions", label: "表示回数" },
  { key: "reach", label: "リーチ" },
  { key: "views", label: "閲覧数" },
  { key: "likes", label: "いいね" },
  { key: "comments", label: "コメント" },
  { key: "saves", label: "保存" },
  { key: "shares", label: "シェア" },
  { key: "profileVisits", label: "プロフィールアクセス" },
  { key: "linkClicks", label: "リンククリック" },
  { key: "lineAdds", label: "LINE登録" },
  { key: "formSubmissions", label: "フォーム送信" },
  { key: "inquiries", label: "問い合わせ" },
  { key: "contracts", label: "契約" },
  { key: "revenue", label: "売上（円）" },
];

export function PerformanceRecordFormModal({
  initial,
  prefill,
  onClose,
  onSaved,
}: {
  initial?: PerformanceRecord;
  prefill?: Prefill;
  onClose: () => void;
  onSaved: (record: PerformanceRecord) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerformanceRecordFormValues>({
    resolver: zodResolver(performanceRecordFormSchema),
    defaultValues: buildDefaultValues(initial, prefill),
  });

  const onSubmit = handleSubmit((values) => {
    const now = new Date().toISOString();
    const id = initial?.id ?? generatePerformanceRecordId();
    const contentId = initial?.contentId ?? prefill?.contentId ?? id;
    const record: PerformanceRecord = {
      id,
      contentId,
      contentType: initial?.contentType ?? CHANNEL_TO_CONTENT_TYPE[values.channel],
      channel: values.channel,
      publishedAt: values.publishedAt,
      measurementPeriod: values.measurementPeriod || "",
      strategyName: values.strategyName || "",
      target: values.target || "",
      title: values.title,
      notes: values.notes || "",
      metrics: formStringsToMetrics(values.metrics),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    savePerformanceRecord(record);
    onSaved(record);
  });

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-[15px] font-extrabold text-neutral-900">
            {initial ? "成果記録を編集" : "成果を記録"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
          >
            閉じる
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="コンテンツ名" error={errors.title}>
              <input className={inputClass} {...register("title")} />
            </Field>
            <Field label="媒体" error={errors.channel}>
              <select className={inputClass} {...register("channel")}>
                {PERFORMANCE_CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="公開日" error={errors.publishedAt}>
              <input type="date" className={inputClass} {...register("publishedAt")} />
            </Field>
            <Field label="計測期間（任意）" error={errors.measurementPeriod}>
              <input
                className={inputClass}
                placeholder="例）公開後7日間"
                {...register("measurementPeriod")}
              />
            </Field>
            <Field label="選択した戦略（任意）" error={errors.strategyName}>
              <input className={inputClass} {...register("strategyName")} />
            </Field>
            <Field label="ターゲット（任意）" error={errors.target}>
              <input className={inputClass} {...register("target")} />
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-neutral-700">
              成果指標（分かる範囲でOK・空欄可）
            </span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {METRIC_FIELDS.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  error={errors.metrics?.[field.key] as FieldError | undefined}
                >
                  <input
                    inputMode="numeric"
                    className={inputClass}
                    {...register(`metrics.${field.key}` as const)}
                  />
                </Field>
              ))}
            </div>
          </div>

          <Field label="メモ（任意）" error={errors.notes}>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              placeholder="良かった点・改善点など"
              {...register("notes")}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-[13px] font-semibold text-neutral-600 transition hover:border-neutral-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
