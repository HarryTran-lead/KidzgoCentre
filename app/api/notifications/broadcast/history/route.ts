import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.BROADCAST_HISTORY,
    method: "GET",
    includeQuery: true,
  });
}
