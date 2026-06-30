import { proxyPassthrough } from "@/app/api/_utils/proxy";
import { BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";

type Params = {
  params: Promise<{
    id: string;
    branchId: string;
  }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id, branchId } = await params;

  return proxyPassthrough({
    req,
    endpoint: BACKEND_ADMIN_ENDPOINTS.PROGRAMS_ASSIGN_BRANCH(id, branchId),
    includeQuery: false,
  });
}
