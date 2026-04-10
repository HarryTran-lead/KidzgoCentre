import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.ANNOTATION_BY_ID(id),
    method: "PUT",
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.ANNOTATION_BY_ID(id),
    method: "DELETE",
  });
}
