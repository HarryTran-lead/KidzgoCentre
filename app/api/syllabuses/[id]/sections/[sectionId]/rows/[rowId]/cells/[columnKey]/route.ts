import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string; sectionId: string; rowId: string; columnKey: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  const { id, sectionId, rowId, columnKey } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.TABLE_CELL(id, sectionId, rowId, columnKey));

  return forwardToBackend(req, backendUrl, {
    method: "PATCH",
    body,
    context: {
      method: "PATCH",
      endpoint: "syllabuses/sections/rows/cells",
      id: `${id}/${sectionId}/${rowId}/${columnKey}`,
    },
  });
}
