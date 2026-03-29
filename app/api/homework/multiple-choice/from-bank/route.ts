import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  MULTIPLE_CHOICE_FROM_BANK: "/homework/multiple-choice/from-bank",
};

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.MULTIPLE_CHOICE_FROM_BANK,
    method: "POST",
    body,
  });
}
