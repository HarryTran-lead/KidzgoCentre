import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSES_CAPACITY(id));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "classes/capacity", id },
  });
}
