import { proxyPassthrough } from "@/app/api/_utils/proxy";

type StaffPathContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(req: Request, context: StaffPathContext) {
  const { path } = await context.params;
  return proxyPassthrough({
    req,
    endpoint: `/staff/${path.join("/")}`,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
