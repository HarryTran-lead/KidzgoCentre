import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_HOMEWORK_ENDPOINTS = {
  AI_FEEDBACK: (homeworkStudentId: string) =>
    `/homework/submissions/${homeworkStudentId}/ai-feedback`,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ homeworkStudentId: string }> }
) {
  const { homeworkStudentId } = await params;
  const body = await req.json().catch(() => ({}));

  return proxyJson({
    req,
    endpoint: BACKEND_HOMEWORK_ENDPOINTS.AI_FEEDBACK(homeworkStudentId),
    method: "POST",
    body,
  });
}
