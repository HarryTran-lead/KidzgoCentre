import { buildApiUrl, BACKEND_CLASS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_CLASS_ENDPOINTS.MODULE_PROGRESS(id));
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "classes/module-progress", id },
  });
}
