import { proxyJson } from "@/app/api/_utils/proxy";
import { BACKEND_PAUSE_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: BACKEND_PAUSE_ENROLLMENT_ENDPOINTS.OUTCOME(id),
    method: "PUT",
    body,
  });
}
