import { proxyPassthrough } from "@/app/api/_utils/proxy";

type MediaPathContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(req: Request, context: MediaPathContext) {
  const { path } = await context.params;
  return proxyPassthrough({
    req,
    endpoint: `/media/${path.join("/")}`,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
