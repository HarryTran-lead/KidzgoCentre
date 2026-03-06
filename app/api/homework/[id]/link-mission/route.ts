import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  LINK_MISSION: (id: string) => `/homework/${id}/link-mission`,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.LINK_MISSION(id),
    method: "POST",
    body,
  });
}

