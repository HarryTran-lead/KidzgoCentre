import { buildApiUrl, BACKEND_REPORT_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const qs = getQueryString(req);
  const url = buildFullUrl(buildApiUrl(BACKEND_REPORT_REQUEST_ENDPOINTS.BASE), qs);

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "report-requests" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_REPORT_REQUEST_ENDPOINTS.BASE);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "report-requests" },
  });
}
