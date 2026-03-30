import { buildApiUrl, BACKEND_QUESTION_BANK_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

export async function GET(req: Request) {
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.GET_ALL);
  const fullUrl = buildFullUrl(url, queryString);
  return forwardToBackend(req, fullUrl, { method: "GET", context: { method: "GET", endpoint: "question-bank" } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_QUESTION_BANK_ENDPOINTS.CREATE);

  // DEBUG
  console.log("[QUESTION_BANK] URL:", url);
  console.log("[QUESTION_BANK] BODY:", JSON.stringify(body, null, 2));

  return forwardToBackend(req, url, { method: "POST", body, context: { method: "POST", endpoint: "question-bank" } });
}
