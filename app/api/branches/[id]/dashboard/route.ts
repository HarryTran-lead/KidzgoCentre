import { proxyReportsV3Request } from "@/app/api/_utils/reports-v3-proxy";
import { BACKEND_REPORTS_V3_ENDPOINTS } from "@/constants/apiURL";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyReportsV3Request(req, BACKEND_REPORTS_V3_ENDPOINTS.BRANCH_DASHBOARD(id), {
    endpoint: `branches/${id}/dashboard`,
    id,
  });
}
