import { proxyJson } from "@/app/api/_utils/proxy";

type Context = {
  params: Promise<{
    segments: string[];
  }>;
};

function buildProgramProgressionEndpoint(segments: string[]): string {
  const normalizedSegments = segments.filter(Boolean);
  if (normalizedSegments.length === 0) {
    return "/program-progressions";
  }

  return `/program-progressions/${normalizedSegments.join("/")}`;
}

async function readRequestBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function GET(req: Request, context: Context) {
  const { segments } = await context.params;

  return proxyJson({
    req,
    endpoint: buildProgramProgressionEndpoint(segments),
    method: "GET",
    includeQuery: true,
  });
}

export async function POST(req: Request, context: Context) {
  const { segments } = await context.params;
  const body = await readRequestBody(req);

  return proxyJson({
    req,
    endpoint: buildProgramProgressionEndpoint(segments),
    method: "POST",
    includeQuery: true,
    body,
  });
}

export async function PUT(req: Request, context: Context) {
  const { segments } = await context.params;
  const body = await readRequestBody(req);

  return proxyJson({
    req,
    endpoint: buildProgramProgressionEndpoint(segments),
    method: "PUT",
    includeQuery: true,
    body,
  });
}

export async function PATCH(req: Request, context: Context) {
  const { segments } = await context.params;
  const body = await readRequestBody(req);

  return proxyJson({
    req,
    endpoint: buildProgramProgressionEndpoint(segments),
    method: "PATCH",
    includeQuery: true,
    body,
  });
}

export async function DELETE(req: Request, context: Context) {
  const { segments } = await context.params;

  return proxyJson({
    req,
    endpoint: buildProgramProgressionEndpoint(segments),
    method: "DELETE",
    includeQuery: true,
  });
}
