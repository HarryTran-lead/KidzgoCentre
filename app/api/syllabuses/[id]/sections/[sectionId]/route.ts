import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string; sectionId: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const { id, sectionId } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.SECTION_BY_ID(id, sectionId));

  return forwardToBackend(req, backendUrl, {
    method: "PATCH",
    body,
    context: { method: "PATCH", endpoint: "syllabuses/sections", id: `${id}/${sectionId}` },
  });
}
