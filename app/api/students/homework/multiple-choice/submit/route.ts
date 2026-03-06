import { proxyJson } from "@/app/api/_utils/proxy";

const BACKEND_STUDENT_HOMEWORK_ENDPOINTS = {
  MULTIPLE_CHOICE_SUBMIT: "/students/homework/multiple-choice/submit",
};

export async function POST(req: Request) {
  const body = await req.json();
  return proxyJson({
    req,
    endpoint: BACKEND_STUDENT_HOMEWORK_ENDPOINTS.MULTIPLE_CHOICE_SUBMIT,
    method: "POST",
    body,
  });
}

