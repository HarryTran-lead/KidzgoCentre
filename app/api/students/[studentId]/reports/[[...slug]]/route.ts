import { proxyReportsV3Request } from "@/app/api/_utils/reports-v3-proxy";
import { BACKEND_REPORTS_V3_ENDPOINTS } from "@/constants/apiURL";

type RouteContext = {
  params: Promise<{
    studentId: string;
    slug?: string[];
  }>;
};

function buildBackendPath(studentId: string, slug?: string[]) {
  const base = BACKEND_REPORTS_V3_ENDPOINTS.STUDENT_REPORTS(studentId);
  if (!slug || slug.length === 0) {
    return base;
  }
  return `${base}/${slug.map(encodeURIComponent).join("/")}`;
}

async function handle(req: Request, context: RouteContext) {
  const { studentId, slug } = await context.params;
  return proxyReportsV3Request(req, buildBackendPath(studentId, slug), {
    endpoint: `students/${studentId}/reports/${slug?.join("/") ?? ""}`.replace(/\/$/, ""),
    id: studentId,
  });
}

export async function GET(req: Request, context: RouteContext) {
  return handle(req, context);
}
