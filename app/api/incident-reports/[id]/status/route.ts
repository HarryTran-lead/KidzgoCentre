import { buildApiUrl, BACKEND_INCIDENT_REPORT_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_INCIDENT_REPORT_ENDPOINTS.STATUS(id));

  return forwardToBackend(req, url, {
    method: "PATCH",
    body,
    context: { method: "PATCH", endpoint: "incident-reports/status", id },
  });
}
