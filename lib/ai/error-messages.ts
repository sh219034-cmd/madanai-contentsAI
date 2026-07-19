import { GenerationError } from "./client";

export type GenerationErrorResponse = {
  status: number;
  code: string;
  message: string;
};

/**
 * 生成エラーを、次に何をすればよいか分かる日本語メッセージへ変換する。
 * APIエラーコードや例外の詳細はそのまま利用者には見せない。
 */
export function mapGenerationError(error: unknown): GenerationErrorResponse {
  if (error instanceof GenerationError) {
    switch (error.code) {
      case "missing_api_key":
        return {
          status: 503,
          code: error.code,
          message:
            "AI機能がまだ利用できません。管理者にANTHROPIC_API_KEYの設定をご確認いただくか、「サンプルで確認する」から画面の動作をお試しください。",
        };
      case "invalid_model":
        return {
          status: 503,
          code: error.code,
          message:
            "設定されているAIモデルが利用できません。管理者にANTHROPIC_GENERATION_MODEL / ANTHROPIC_REGENERATION_MODELの設定をご確認いただくか、「サンプルで確認する」から画面の動作をお試しください。",
        };
      case "rate_limited":
        return {
          status: 429,
          code: error.code,
          message:
            "AIの利用が混み合っています。入力内容は保存されていますので、少し時間を置いてからもう一度お試しください。",
        };
      case "network":
        return {
          status: 502,
          code: error.code,
          message:
            "AIとの通信に失敗しました。入力内容は保存されています。時間を置いてもう一度お試しください。",
        };
      case "refusal":
        return {
          status: 422,
          code: error.code,
          message:
            "この内容では生成を見送りました。テーマや表現を見直して、もう一度お試しください。",
        };
      case "parse_failed":
        return {
          status: 502,
          code: error.code,
          message:
            "AIの応答をうまく読み取れませんでした。入力内容は保存されていますので、もう一度お試しください。",
        };
      case "api_error":
      default:
        return {
          status: 502,
          code: "api_error",
          message:
            "AIとの通信でエラーが発生しました。入力内容は保存されていますので、もう一度お試しください。",
        };
    }
  }

  return {
    status: 500,
    code: "unknown",
    message:
      "予期しないエラーが発生しました。入力内容は保存されていますので、もう一度お試しください。",
  };
}
