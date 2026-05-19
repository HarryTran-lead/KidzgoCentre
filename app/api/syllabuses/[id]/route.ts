import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";
import { forwardToBackend } from "@/lib/api/routeHelpers";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "GET",
    context: { method: "GET", endpoint: "syllabuses", id },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "PUT",
    body,
    context: { method: "PUT", endpoint: "syllabuses", id },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.BY_ID(id));

  return forwardToBackend(req, backendUrl, {
    method: "DELETE",
    context: { method: "DELETE", endpoint: "syllabuses", id },
  });
}
