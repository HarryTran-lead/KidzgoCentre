import { proxyJson } from "@/app/api/_utils/proxy";

export async function GET(req: Request) {
  return proxyJson({
    req,
    endpoint: "/attendance/students",
    method: "GET",
    includeQuery: true,
  });
}
