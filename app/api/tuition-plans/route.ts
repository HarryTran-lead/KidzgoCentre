import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "tuition-plans" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "tuition-plans" },
  });
}
