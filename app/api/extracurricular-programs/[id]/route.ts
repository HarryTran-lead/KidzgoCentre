import { proxyJson } from "@/app/api/_utils/proxy";

type ExtracurricularProgramContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: ExtracurricularProgramContext) {
  const { id } = await context.params;

  return proxyJson({
    req,
    endpoint: `/extracurricular-programs/${id}`,
    method: "GET",
    includeQuery: true,
  });
}

export async function PUT(req: Request, context: ExtracurricularProgramContext) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  return proxyJson({
    req,
    endpoint: `/extracurricular-programs/${id}`,
    method: "PUT",
    body,
  });
}
