import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.TEMPLATE_BY_ID(id),
    method: "GET",
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.TEMPLATE_BY_ID(id),
    method: "PUT",
    body,
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.TEMPLATE_BY_ID(id),
    method: "DELETE",
  });
}
