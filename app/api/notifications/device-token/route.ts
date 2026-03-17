import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJsonOptionalAuth } from "@/app/api/_utils/proxy-optional-auth";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJsonOptionalAuth({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.DEVICE_TOKEN,
    method: "POST",
    body,
  });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  return proxyJsonOptionalAuth({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.DEVICE_TOKEN,
    method: "DELETE",
    body,
  });
}
