import Link from "next/link";

/** 入力・戦略・結果の各画面ヘッダーに置く「作成履歴」への共通リンク。 */
export function HistoryLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/history"
      className={`text-xs font-semibold text-neutral-500 transition hover:text-neutral-800 ${className}`}
    >
      作成履歴
    </Link>
  );
}
