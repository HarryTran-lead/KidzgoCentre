import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  REWARD_STARS: (id: string) => `/homework/${id}/reward-stars`,
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.REWARD_STARS(id),
    method: "PUT",
    body,
  });
}

