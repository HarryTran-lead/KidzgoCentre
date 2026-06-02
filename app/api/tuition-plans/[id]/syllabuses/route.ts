import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUSES(id));
  return forwardToBackend(req, buildFullUrl(backendUrl, queryString), {
    method: "GET",
    context: { method: "GET", endpoint: "tuition-plans/syllabuses", id },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUSES(id));
  return forwardToBackend(req, backendUrl, {
    method: "POST",
    context: { method: "POST", endpoint: "tuition-plans/syllabuses", id },
  });
}
