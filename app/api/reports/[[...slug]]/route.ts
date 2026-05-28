import { proxyReportsV3Request } from "@/app/api/_utils/reports-v3-proxy";
import { BACKEND_REPORTS_V3_ENDPOINTS } from "@/constants/apiURL";

type RouteContext = {
  params: Promise<{
    slug?: string[];
  }>;
};

function buildBackendPath(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return BACKEND_REPORTS_V3_ENDPOINTS.BASE;
  }

  return `${BACKEND_REPORTS_V3_ENDPOINTS.BASE}/${slug.map(encodeURIComponent).join("/")}`;
}

async function handle(req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const endpoint = buildBackendPath(slug);
  return proxyReportsV3Request(req, endpoint, {
    endpoint: `reports/${slug?.join("/") ?? ""}`.replace(/\/$/, ""),
  });
}

export async function GET(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function PUT(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function DELETE(req: Request, context: RouteContext) {
  return handle(req, context);
}
