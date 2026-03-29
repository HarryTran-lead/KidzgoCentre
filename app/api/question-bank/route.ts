import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_QUESTION_BANK_ENDPOINTS = {
  BASE: "/question-bank",
};

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: BACKEND_QUESTION_BANK_ENDPOINTS.BASE,
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_QUESTION_BANK_ENDPOINTS.BASE,
    method: "POST",
    body,
  });
}
