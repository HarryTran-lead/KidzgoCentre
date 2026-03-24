import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.ASSIGN_CLASS(id));

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "registrations/assign-class", id },
  });
}
