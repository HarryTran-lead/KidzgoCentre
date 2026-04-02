import { proxyPassthrough } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  ANALYZE_SPEAKING: "/students/ai-speaking/analyze",
};

export async function POST(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.ANALYZE_SPEAKING,
    includeQuery: true,
  });
}
