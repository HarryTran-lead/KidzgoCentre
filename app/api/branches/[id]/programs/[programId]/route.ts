import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string; programId: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const { id, programId } = await params;
  const backendUrl = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.PROGRAM_BY_ID(id, programId));
  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "branches/programs/byId", id, programId },
  });
}
