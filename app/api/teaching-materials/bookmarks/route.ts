import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.BOOKMARKS,
    method: "GET",
    includeQuery: true,
  });
}
