import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.UPGRADE(id));
  const fullUrl = buildFullUrl(url, queryString);

  return forwardToBackend(req, fullUrl, {
    method: "POST",
    context: { method: "POST", endpoint: "registrations/upgrade", id },
  });
}
