import { proxyJson } from "@/app/api/_utils/proxy";

type Context = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  const { sessionId } = await context.params;
  return proxyJson({
    req,
    endpoint: `/attendance/${sessionId}`,
    method: "GET",
  });
}

export async function POST(req: Request, context: Context) {
  const { sessionId } = await context.params;
  const body = await req.json();

  return proxyJson({
    req,
    endpoint: `/attendance/${sessionId}`,
    method: "POST",
    body,
  });
}
