import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id, versionId } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.VERSION_BY_ID(id, versionId));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses/versions/byId", id, versionId },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id, versionId } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.VERSION_BY_ID(id, versionId));
  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "syllabuses/versions/byId", id, versionId },
  });
}
