import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  QUICK_GRADE: (homeworkStudentId: string) =>
    `/homework/submissions/${homeworkStudentId}/quick-grade`,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  const body = await req.json().catch(() => ({}));

  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.QUICK_GRADE(homeworkStudentId),
    method: "POST",
    body,
  });
}
