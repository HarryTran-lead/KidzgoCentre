import { buildApiUrl, BACKEND_INCIDENT_REPORT_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_INCIDENT_REPORT_ENDPOINTS.COMMENTS(id));

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "incident-reports/comments", id },
  });
}
