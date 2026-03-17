import { BACKEND_NOTIFICATION_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_NOTIFICATION_ENDPOINTS.MARK_READ(id),
    method: "PATCH",
  });
}
