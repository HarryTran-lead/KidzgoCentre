import { buildApiUrl, BACKEND_QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.TOGGLE_STATUS(id));
  return forwardToBackend(req, url, {
    method: "PATCH",
    context: { method: "PATCH", endpoint: "question-bank/toggle-status", id },
  });
}
