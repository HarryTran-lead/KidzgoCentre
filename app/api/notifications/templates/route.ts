import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.TEMPLATES,
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.TEMPLATES,
    method: "POST",
    body,
  });
}
