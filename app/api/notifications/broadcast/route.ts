import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.BROADCAST,
    method: "POST",
    body,
  });
}
