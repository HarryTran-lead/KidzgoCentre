import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.METADATA(id));

  return forwardToBackend(req, backendUrl, {
    method: "PATCH",
    body,
    context: { method: "PATCH", endpoint: "syllabuses/metadata", id },
  });
}
