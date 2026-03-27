import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_LEAVE_REQUEST_ENDPOINTS.CANCEL(id),
    method: "PUT",
    body: {},
  });
}
