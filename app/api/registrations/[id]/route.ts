import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.GET_BY_ID(id));

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "registrations", id },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.UPDATE(id));

  return forwardToBackend(req, url, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "registrations", id },
  });
}
