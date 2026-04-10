import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyJson } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{
    id: string;
    slideNumber: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id, slideNumber } = await params;

  return proxyJson({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.SLIDE_NOTES(id, Number(slideNumber)),
    method: "GET",
  });
}
