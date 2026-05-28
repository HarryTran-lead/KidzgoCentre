import { buildApiUrl, BACKEND_SESSION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_SESSION_ENDPOINTS.LESSON_PLAN_DOCUMENT(id));

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "sessions/lesson-plan-document", id },
  });
}
