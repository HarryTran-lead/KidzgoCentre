import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.BASE);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses" },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.BASE);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "syllabuses" },
  });
}
