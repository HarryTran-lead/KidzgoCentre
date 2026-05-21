import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.IMPORT_CONFIGURATION);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses/import-configuration" },
  });
}

export async function PUT(req: Request) {
  const queryString = getQueryString(req);
  const body = await req.json();
  const url = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.IMPORT_CONFIGURATION);
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "syllabuses/import-configuration" },
  });
}
