import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  MY_FEEDBACK: "/students/homework/feedback/my",
};

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.MY_FEEDBACK,
    method: "GET",
    includeQuery: true,
  });
}

