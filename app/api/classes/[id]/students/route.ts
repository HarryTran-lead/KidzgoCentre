import { BACKEND_CLASS_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_CLASS_ENDPOINTS.GET_STUDENTS(id));
  const fullUrl = buildFullUrl(backendUrl, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "classes/students", id },
  });
}
