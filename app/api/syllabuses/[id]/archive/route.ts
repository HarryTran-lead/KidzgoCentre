import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.ARCHIVE(id));

  return forwardToBackend(req, backendUrl, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "syllabuses/archive", id },
  });
}
