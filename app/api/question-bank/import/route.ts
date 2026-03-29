import { proxyPassthrough } from "@/app/api/_utils/proxy";

const BACKEND_QUESTION_BANK_ENDPOINTS = {
  IMPORT: "/question-bank/import",
};

export async function POST(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: BACKEND_QUESTION_BANK_ENDPOINTS.IMPORT,
    includeQuery: true,
  });
}
