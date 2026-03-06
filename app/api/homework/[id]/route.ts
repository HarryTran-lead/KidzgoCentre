import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  BY_ID: (id: string) => `/homework/${id}`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.BY_ID(id),
    method: "GET",
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.BY_ID(id),
    method: "PUT",
    body,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.BY_ID(id),
    method: "DELETE",
  });
}

