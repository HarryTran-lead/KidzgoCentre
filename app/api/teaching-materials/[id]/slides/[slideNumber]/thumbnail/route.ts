import { BACKEND_TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { proxyPassthrough } from "@/app/api/_utils/proxy";

type Params = {
  params: Promise<{
    id: string;
    slideNumber: string;
  }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id, slideNumber } = await params;

  return proxyPassthrough({
    req,
    endpoint: BACKEND_TEACHING_MATERIALS_ENDPOINTS.SLIDE_THUMBNAIL(id, Number(slideNumber)),
    includeQuery: true,
  });
}
