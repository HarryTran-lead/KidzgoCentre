import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const queryString = getQueryString(req);
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.TRANSFER_CLASS(id));
  const fullUrl = buildFullUrl(url, queryString);

  let body: any = undefined;
  try {
    const rawBody = await req.text();
    if (rawBody.trim()) {
      body = JSON.parse(rawBody);
    }
  } catch {
    body = undefined;
  }

  return forwardToBackend(req, fullUrl, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "registrations/transfer-class", id },
  });
}
