import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS } from "@/constants/apiURL";

export async function PUT(req: Request) {
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: BACKEND_LEAVE_REQUEST_ENDPOINTS.APPROVE_BULK,
    method: "PUT",
    body,
  });
}
