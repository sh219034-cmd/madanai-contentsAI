export function SectionHeading({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
        STEP {index}
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-6 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}
