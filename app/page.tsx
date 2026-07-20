import { Suspense } from "react";
import { ContentInputForm } from "@/components/input/ContentInputForm";
import { MADANAI_BRAND } from "@/lib/madanai-brand";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 sm:py-24">
      <div className="mb-12 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)]" />
          <span className="text-sm font-bold text-neutral-800">
            {MADANAI_BRAND.name}
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
          特典コンテンツ作成
        </p>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-[34px]">
          今日は何を伝えますか？
        </h1>
        <p className="text-[15px] leading-7 text-neutral-500">
          テーマとターゲットを入力すると、LINE登録特典のPDFと集客用コンテンツを一括で作成します。
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-400">読み込み中...</p>}>
        <ContentInputForm />
      </Suspense>
    </main>
  );
}
