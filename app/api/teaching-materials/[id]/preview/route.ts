import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyPassthrough } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyPassthrough({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.PREVIEW(id),
    includeQuery: true,
  });
}
