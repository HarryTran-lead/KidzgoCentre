import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSES_PREVIEW_SESSIONS);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "classes/preview-sessions" },
  });
}
