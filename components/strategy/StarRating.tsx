export function StarRating({ score, size = "sm" }: { score: 1 | 2 | 3 | 4 | 5; size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-lg" : "text-xs";
  return (
    <span className={`font-mono tracking-widest ${textSize}`} aria-label={`おすすめ度 ${score}/5`}>
      <span className="bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] bg-clip-text text-transparent">
        {"★".repeat(score)}
      </span>
      <span className="text-neutral-200">{"★".repeat(5 - score)}</span>
    </span>
  );
}
