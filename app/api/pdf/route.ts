import { NextResponse } from "next/server";
import { z } from "zod";
import { chromium } from "playwright";
import { renderPdfDocumentHtml } from "@/lib/pdf/render-html";

const pdfSectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "cover",
    "subtitle",
    "intro",
    "toc",
    "body",
    "checklist",
    "diagnosis",
    "summary",
    "cta",
  ]),
  title: z.string().max(200),
  body: z.string().max(3000),
  items: z.array(z.string().max(300)).max(40).optional(),
  order: z.number(),
});

const pdfRequestSchema = z.object({
  theme: z.string().min(1).max(120),
  sections: z.array(pdfSectionSchema).min(1).max(40),
});

/**
 * GeneratedContent.pdf.sections をA4のPDFバイナリへ変換する。
 * データはクライアント(localStorage)から都度受け取るだけで、
 * サーバー側に永続化はしない。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const parsed = pdfRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "PDF生成データの形式が正しくありません。結果画面から再度お試しください。" },
      { status: 400 },
    );
  }

  const html = renderPdfDocumentHtml(parsed.data.sections, parsed.data.theme);

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    // PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH は開発環境でPlaywrightの
    // ブラウザバイナリのバージョンが合わない場合の任意の上書き用。
    // 通常のデプロイ環境では未設定のままでよい(Playwrightが自動解決する)。
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    browser = await chromium.launch(executablePath ? { executablePath } : undefined);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    const fileNameBase = parsed.data.theme.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "madanai-content";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="download.pdf"; filename*=UTF-8''${encodeURIComponent(fileNameBase)}.pdf`,
      },
    });
  } catch (error) {
    console.error(
      "[api/pdf] failed to render pdf",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { message: "PDFの生成に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  } finally {
    if (browser) await browser.close();
  }
}
