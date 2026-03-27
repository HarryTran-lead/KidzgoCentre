import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.SUGGEST_CLASSES(id));

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "registrations/suggest-classes", id },
  });
}
