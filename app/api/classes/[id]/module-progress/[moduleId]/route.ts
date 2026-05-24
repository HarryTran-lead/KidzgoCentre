import { buildApiUrl, BACKEND_CLASS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
    moduleId: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id, moduleId } = await params;
  const backendUrl = buildApiUrl(BACKEND_CLASS_ENDPOINTS.MODULE_PROGRESS_BY_MODULE(id, moduleId));

  return forwardToBackend(req, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "classes/module-progress/module", id },
  });
}
