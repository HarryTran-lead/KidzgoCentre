import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend, getQueryString, buildFullUrl } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{ id: string; sectionId: string; rowId: string }>;
};

export async function DELETE(req: Request, { params }: Params) {
  const { id, sectionId, rowId } = await params;
  const baseBackendUrl = buildApiUrl(`${BACKEND_SYLLABUS_ENDPOINTS.TABLE_ROWS(id, sectionId)}/${encodeURIComponent(rowId)}`);
  const queryString = getQueryString(req);
  const backendUrl = buildFullUrl(baseBackendUrl, queryString);

  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "syllabuses/sections/rows", id: `${id}/${sectionId}/${rowId}` },
  });
}
