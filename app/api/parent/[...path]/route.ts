import { proxyPassthrough } from "@/app/api/_utils/proxy";

type ParentPathContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(req: Request, context: ParentPathContext) {
  const { path } = await context.params;
  return proxyPassthrough({
    req,
    endpoint: `/parent/${path.join("/")}`,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
