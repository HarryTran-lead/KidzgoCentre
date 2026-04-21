import { buildApiUrl, BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

export async function POST(req: Request) {
  const body = await req.json();
  const url = buildApiUrl(BACKEND_REGISTRATION_ENDPOINTS.IMPORT_ACTIVE);

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "registrations/import-active" },
  });
}
