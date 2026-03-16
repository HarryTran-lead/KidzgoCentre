import { proxyJson } from "@/app/api/_utils/proxy";

type Context = {
  params: Promise<{
    sessionId: string;
    studentProfileId: string;
  }>;
};

export async function PUT(req: Request, context: Context) {
  const { sessionId, studentProfileId } = await context.params;
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: `/attendance/${sessionId}/students/${studentProfileId}`,
    method: "PUT",
    body,
  });
}
