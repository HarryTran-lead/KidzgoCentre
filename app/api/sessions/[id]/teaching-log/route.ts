import { buildApiUrl, BACKEND_SESSION_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_SESSION_ENDPOINTS.TEACHING_LOG(id));

  return forwardToBackend(req, url, {
    method: "GET",
    context: { method: "GET", endpoint: "sessions/teaching-log", id },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_SESSION_ENDPOINTS.TEACHING_LOG(id));

  return forwardToBackend(req, url, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "sessions/teaching-log", id },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const url = buildApiUrl(BACKEND_SESSION_ENDPOINTS.TEACHING_LOG(id));

  return forwardToBackend(req, url, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "sessions/teaching-log", id },
  });
}
