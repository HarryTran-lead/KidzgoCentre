import { proxyPassthrough } from "@/app/api/_utils/proxy";

type RouteParams = { slug?: string[] };

function buildEndpoint(slug?: string[]) {
  const segments = slug?.filter(Boolean) ?? [];
  return `/missions${segments.length ? `/${segments.join("/")}` : ""}`;
}

async function handle(
  req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const resolved = await params;
  return proxyPassthrough({
    req,
    endpoint: buildEndpoint(resolved.slug),
  });
}

export async function GET(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  return handle(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  return handle(req, context);
}

export async function PUT(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  return handle(req, context);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  return handle(req, context);
}
