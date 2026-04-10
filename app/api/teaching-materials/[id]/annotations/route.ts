import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.ANNOTATIONS(id),
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.ANNOTATIONS(id),
    method: "POST",
  });
}
