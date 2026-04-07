import { buildApiUrl, BACKEND_REPORT_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_REPORT_REQUEST_ENDPOINTS.BY_ID(id));

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "report-requests", id },
  });
}
