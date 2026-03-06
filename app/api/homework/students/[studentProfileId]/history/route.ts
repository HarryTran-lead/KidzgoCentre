import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  STUDENT_HISTORY: (studentProfileId: string) =>
    `/homework/students/${studentProfileId}/history`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentProfileId: string }> }
) {
  const { studentProfileId } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.STUDENT_HISTORY(studentProfileId),
    method: "GET",
    includeQuery: true,
  });
}

