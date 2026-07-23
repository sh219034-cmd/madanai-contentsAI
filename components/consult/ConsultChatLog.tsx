import type { ConsultQaItem } from "@/lib/types";

function AssistantBubble({ item }: { item: ConsultQaItem }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-neutral-200 bg-neutral-50 px-4 py-3">
        <p className="text-[14px] leading-relaxed text-neutral-900">{item.question}</p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-neutral-400">{item.reason}</p>
      </div>
    </div>
  );
}

function UserBubble({ answer }: { answer: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[linear-gradient(135deg,#ff6ec7_0%,#a855f7_55%,#7c3aed_100%)] px-4 py-3 text-[14px] leading-relaxed text-white">
        {answer}
      </div>
    </div>
  );
}

/** ChatGPTのような1問1答のチャットUI。AIの質問+理由と、ユーザーの回答を時系列に積み上げる。 */
export function ConsultChatLog({
  qaItems,
  draftAnswers,
  onDraftChange,
  disabled,
}: {
  qaItems: ConsultQaItem[];
  draftAnswers: Record<string, string>;
  onDraftChange: (id: string, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {qaItems.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <AssistantBubble item={item} />
          {item.answer !== undefined ? (
            <UserBubble answer={item.answer} />
          ) : (
            <div className="flex justify-end">
              <textarea
                value={draftAnswers[item.id] ?? ""}
                onChange={(e) => onDraftChange(item.id, e.target.value)}
                disabled={disabled}
                placeholder="回答を入力..."
                className="w-full max-w-[85%] min-h-20 resize-y rounded-2xl rounded-tr-sm border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
