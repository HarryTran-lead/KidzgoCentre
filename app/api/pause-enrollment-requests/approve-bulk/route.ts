import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_PAUSE_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";

export async function PUT(req: Request) {
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: BACKEND_PAUSE_ENROLLMENT_ENDPOINTS.APPROVE_BULK,
    method: "PUT",
    body,
  });
}
