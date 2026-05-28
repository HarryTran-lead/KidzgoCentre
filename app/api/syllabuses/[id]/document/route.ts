import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.DOCUMENT(id));

  return forwardToBackend(req, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses/document", id },
  });
}
