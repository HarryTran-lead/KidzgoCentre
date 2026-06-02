import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string; assignmentId: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const { id, assignmentId } = await params;
  const backendUrl = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.SYLLABUS_ASSIGNMENT(id, assignmentId));
  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "branches/syllabuses/assignment", id, assignmentId },
  });
}
