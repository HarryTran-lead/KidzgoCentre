import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSROOMS_TOGGLE_STATUS(id));

  return forwardToBackend(req, backendUrl, {
    method: "PATCH",
    context: { method: "PATCH", endpoint: "classrooms/toggle-status", id },
  });
}
