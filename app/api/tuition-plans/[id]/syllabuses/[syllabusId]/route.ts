import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string; syllabusId: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const { id, syllabusId } = await params;
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUS_BY_ID(id, syllabusId));
  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "tuition-plans/syllabuses/byId", id, syllabusId },
  });
}
