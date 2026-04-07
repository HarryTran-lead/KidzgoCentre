import { buildApiUrl, BACKEND_REPORT_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_REPORT_REQUEST_ENDPOINTS.CANCEL(id));

  return forwardToBackend(req, url, {
    method: "POST",
    context: { method: "POST", endpoint: "report-requests/cancel", id },
  });
}
