import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string; sectionId: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id, sectionId } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.TABLE_ROWS(id, sectionId));

  return forwardToBackend(req, backendUrl, {
    method: "POST",
    body,
    context: { method: "POST", endpoint: "syllabuses/sections/rows", id: `${id}/${sectionId}` },
  });
}
