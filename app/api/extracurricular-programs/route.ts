import { proxyJson } from "@/app/api/_utils/proxy";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: "/extracurricular-programs",
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return proxyJson({
    req,
    endpoint: "/extracurricular-programs",
    method: "POST",
    body,
  });
}
