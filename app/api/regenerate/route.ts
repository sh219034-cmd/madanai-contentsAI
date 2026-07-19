import { NextResponse } from "next/server";
import { regenerateRequestSchema } from "@/lib/ai/regenerate-types";
import { regenerateSectionWithAi } from "@/lib/ai/regenerate-client";
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

  const parsed = regenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "再生成のリクエスト内容が正しくありません。",
      },
      { status: 400 },
    );
  }

  try {
    const { result } = await regenerateSectionWithAi(parsed.data);
    return NextResponse.json({ result });
  } catch (error) {
    const mapped = mapGenerationError(error);
    console.error(`[api/regenerate] failed: ${mapped.code}`);
    return NextResponse.json(
      { error: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
