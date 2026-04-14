import { proxyPassthrough } from "@/app/api/_utils/proxy";
import { BACKEND_QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: BACKEND_QUESTION_BANK_ENDPOINTS.AI_GENERATE_FROM_FILE,
    includeQuery: false,
  });
}
