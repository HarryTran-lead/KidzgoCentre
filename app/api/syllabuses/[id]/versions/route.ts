import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.VERSIONS(id));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses/versions", id },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.VERSIONS(id));
  return forwardToBackend(req, backendUrl, {
    method: "POST",
    context: { method: "POST", endpoint: "syllabuses/versions", id },
  });
}
