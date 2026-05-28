import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import {
  buildFullUrl,
  forwardToBackend,
  getQueryString,
} from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.SYLLABUSES(id));
  const fullUrl = buildFullUrl(backendUrl, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "branches/syllabuses", id },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const backendUrl = buildApiUrl(BACKEND_BRANCH_ENDPOINTS.SYLLABUSES(id));
  const fullUrl = buildFullUrl(backendUrl, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "PUT",
    context: { method: "PUT", endpoint: "branches/syllabuses", id },
  });
}