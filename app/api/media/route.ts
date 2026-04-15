import { proxyPassthrough } from "@/app/api/_utils/proxy";

async function handle(req: Request) {
  return proxyPassthrough({
    req,
    endpoint: "/media",
  });
}

export const GET = handle;
export const POST = handle;
