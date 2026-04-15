import { buildApiUrl, BACKEND_INCIDENT_REPORT_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const qs = getQueryString(req);
  const url = buildFullUrl(buildApiUrl(BACKEND_INCIDENT_REPORT_ENDPOINTS.BASE), qs);

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "incident-reports" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_INCIDENT_REPORT_ENDPOINTS.BASE);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "incident-reports" },
  });
}
