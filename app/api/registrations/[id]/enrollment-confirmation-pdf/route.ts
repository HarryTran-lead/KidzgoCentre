import { proxyPassthrough } from "@/app/api/_utils/proxy";
import { BACKEND_REGISTRATION_ENDPOINTS } from "@/constants/apiURL";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  return proxyPassthrough({
    req,
    endpoint: BACKEND_REGISTRATION_ENDPOINTS.ENROLLMENT_CONFIRMATION_PDF(id),
    includeQuery: true,
  });
}
