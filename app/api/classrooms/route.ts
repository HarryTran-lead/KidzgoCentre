import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSROOMS);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "classrooms" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSROOMS);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "classrooms" },
  });
}
