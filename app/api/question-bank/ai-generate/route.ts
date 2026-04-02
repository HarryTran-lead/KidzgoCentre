import { buildApiUrl, BACKEND_QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.AI_GENERATE);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "question-bank/ai-generate" },
  });
}
