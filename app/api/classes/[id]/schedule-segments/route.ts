import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSES_SCHEDULE_SEGMENTS(id));

  return forwardToBackend(req, backendUrl, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "classes/schedule-segments", id },
  });
}
