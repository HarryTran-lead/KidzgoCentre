import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const url = buildApiUrl(BACKEND_ADMIN_ENDPOINTS.CLASSES_RESYNC_FUTURE_LESSONS(id));

  return forwardToBackend(req, url, {
    method: "POST",
    context: { method: "POST", endpoint: "classes/resync-future-lessons", id },
  });
}
