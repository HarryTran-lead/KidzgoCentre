import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  SUBMISSION_BY_ID: (homeworkStudentId: string) =>
    `/homework/submissions/${homeworkStudentId}`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.SUBMISSION_BY_ID(homeworkStudentId),
    method: "GET",
  });
}

