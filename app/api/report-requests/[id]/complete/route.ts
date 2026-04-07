import { buildApiUrl, BACKEND_REPORT_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  let body = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const url = buildApiUrl(BACKEND_REPORT_REQUEST_ENDPOINTS.COMPLETE(id));

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "report-requests/complete", id },
  });
}
