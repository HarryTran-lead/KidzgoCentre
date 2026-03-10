import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  BY_ID: (homeworkStudentId: string) => `/students/homework/${homeworkStudentId}`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  return proxyJson({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.BY_ID(homeworkStudentId),
    method: "GET",
  });
}

