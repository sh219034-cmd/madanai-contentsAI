"use client";

import { useState } from "react";

export function RegenerateButton() {
  const [showNotice, setShowNotice] = useState(false);

  const handleClick = () => {
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 2200);
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
      >
        ↺ 再生成
      </button>
      {showNotice ? (
        <span className="absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
          Claude API接続後に利用できます
        </span>
      ) : null}
    </div>
  );
}
