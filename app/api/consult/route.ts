import { NextResponse } from "next/server";
import { consultRequestSchema } from "@/lib/consult-schema";
import { consultWithAi } from "@/lib/ai/consult-client";
import { mapGenerationError } from "@/lib/ai/error-messages";

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

  const parsed = consultRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "入力内容が正しくありません。入力画面を確認してください。",
      },
      { status: 400 },
    );
  }

  try {
    const { output, usage } = await consultWithAi(parsed.data.input, parsed.data.qaHistory);
    return NextResponse.json({ result: output, usage });
  } catch (error) {
    const mapped = mapGenerationError(error);
    // 回答内容やAPIキーはログへ出さず、エラー種別のみ記録する
    console.error(`[api/consult] failed: ${mapped.code}`);
    return NextResponse.json(
      { error: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
