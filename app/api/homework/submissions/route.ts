import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  SUBMISSIONS: "/homework/submissions",
};

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.SUBMISSIONS,
    method: "GET",
    includeQuery: true,
  });
}

