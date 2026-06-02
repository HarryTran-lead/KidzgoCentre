import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id, versionId } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.VERSION_PROMOTE(id, versionId));
  return forwardToBackend(req, backendUrl, {
    method: "POST",
    context: { method: "POST", endpoint: "syllabuses/versions/promote", id, versionId },
  });
}
