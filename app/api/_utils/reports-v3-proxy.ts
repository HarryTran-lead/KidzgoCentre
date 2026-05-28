import { buildApiUrl } from "@/constants/apiURL";
import { buildFullUrl, forwardToBackend, getQueryString } from "@/lib/api/routeHelpers";

type ProxyContext = {
  endpoint: string;
  id?: string;
};

export async function proxyReportsV3Request(
  req: Request,
  backendPath: string,
  context: ProxyContext,
) {
  const method = req.method.toUpperCase();
  const url = buildFullUrl(buildApiUrl(backendPath), getQueryString(req));

  let body: unknown;
  if (!["GET", "DELETE"].includes(method)) {
    try {
      body = await req.json();
    } catch {
      body = undefined;
    }
  }

  return forwardToBackend(req, url, {
    method,
    body,
    context: {
      method,
      endpoint: context.endpoint,
      ...(context.id ? { id: context.id } : {}),
    },
  });
}
