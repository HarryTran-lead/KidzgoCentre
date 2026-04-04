import { proxyPassthrough } from "@/app/api/_utils/proxy";

type FinancePathContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(req: Request, context: FinancePathContext) {
  const { path } = await context.params;
  return proxyPassthrough({
    req,
    endpoint: `/finance/${path.join("/")}`,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
