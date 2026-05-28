import { proxyReportsV3Request } from "@/app/api/_utils/reports-v3-proxy";
import { BACKEND_REPORTS_V3_ENDPOINTS } from "@/constants/apiURL";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { studentId } = await context.params;
  return proxyReportsV3Request(req, BACKEND_REPORTS_V3_ENDPOINTS.STUDENT_PARENT_REPORT(studentId), {
    endpoint: `students/${studentId}/parent-report`,
    id: studentId,
  });
}
