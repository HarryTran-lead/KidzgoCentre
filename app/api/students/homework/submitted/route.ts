import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  SUBMITTED: "/students/homework/submitted",
};

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.SUBMITTED,
    method: "GET",
    includeQuery: true,
  });
}

