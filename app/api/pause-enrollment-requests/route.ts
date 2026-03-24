import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_PAUSE_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_PAUSE_ENROLLMENT_ENDPOINTS.GET_ALL,
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: BACKEND_PAUSE_ENROLLMENT_ENDPOINTS.CREATE,
    method: "POST",
    body,
  });
}
