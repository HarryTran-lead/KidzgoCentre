import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  MULTIPLE_CHOICE: "/homework/multiple-choice",
};

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.MULTIPLE_CHOICE,
    method: "POST",
    body,
  });
}

