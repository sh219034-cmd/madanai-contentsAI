import Link from "next/link";

/** 入力・戦略・結果・履歴の各画面ヘッダーに置く「成果管理」への共通リンク。 */
export function PerformanceLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/performance"
      className={`text-xs font-semibold text-neutral-500 transition hover:text-neutral-800 ${className}`}
    >
      成果管理
    </Link>
  );
}
