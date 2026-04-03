import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyPassthrough } from "@/app/api/_utils/proxy";

export async function POST(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.UPLOAD,
    includeQuery: true,
  });
}
