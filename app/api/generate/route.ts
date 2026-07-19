import { NextResponse } from "next/server";
import { contentInputSchema } from "@/lib/schema";
import { generateContentFromAi } from "@/lib/ai/client";
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

  const parsed = contentInputSchema.safeParse(body);
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
    const { output, usage } = await generateContentFromAi(parsed.data);
    return NextResponse.json({ result: output, usage });
  } catch (error) {
    const mapped = mapGenerationError(error);
    // Claudeのレスポンス全文やAPIキーはログへ出さず、エラー種別のみ記録する
    console.error(`[api/generate] failed: ${mapped.code}`);
    return NextResponse.json(
      { error: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
