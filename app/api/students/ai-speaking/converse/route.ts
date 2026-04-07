import { proxyPassthrough } from "@/app/api/_utils/proxy";

const BACKEND_ENDPOINT = "/students/ai-speaking/converse";

export async function POST(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: BACKEND_ENDPOINT,
    includeQuery: true,
  });
}
