import { NextResponse } from "next/server";
import { performanceRecordSchema } from "@/lib/performance-schema";
import { reviewPerformanceWithAi } from "@/lib/ai/performance-review-client";
import { mapPerformanceReviewError } from "@/lib/ai/error-messages";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const parsed = performanceRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "成果データの形式が正しくありません。画面を再読み込みしてもう一度お試しください。",
      },
      { status: 400 },
    );
  }

  try {
    const { output, usage } = await reviewPerformanceWithAi(parsed.data);
    return NextResponse.json({ result: output, usage });
  } catch (error) {
    const mapped = mapPerformanceReviewError(error);
    // 成果データ本文（売上・顧客情報等）やAPIキーはログへ出さず、エラー種別のみ記録する
    console.error(`[api/performance-review] failed: ${mapped.code}`);
    return NextResponse.json(
      { error: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
