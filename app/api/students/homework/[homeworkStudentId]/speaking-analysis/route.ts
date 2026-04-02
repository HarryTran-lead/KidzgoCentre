import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  SPEAKING_ANALYSIS: (homeworkStudentId: string) =>
    `/students/homework/${homeworkStudentId}/speaking-analysis`,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  const body = await req.json().catch(() => ({}));

  return proxyJson({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.SPEAKING_ANALYSIS(homeworkStudentId),
    method: "POST",
    body,
  });
}
