import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  MARK_STATUS: (homeworkStudentId: string) =>
    `/homework/submissions/${homeworkStudentId}/mark-status`,
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.MARK_STATUS(homeworkStudentId),
    method: "PUT",
    body,
  });
}

