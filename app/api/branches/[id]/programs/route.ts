import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.PROGRAMS(id));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "branches/programs", id },
  });
}
