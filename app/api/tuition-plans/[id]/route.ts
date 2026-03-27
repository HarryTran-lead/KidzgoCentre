import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "tuition-plans", id },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "tuition-plans", id },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "tuition-plans", id },
  });
}
